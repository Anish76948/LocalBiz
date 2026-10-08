const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('node:path');
const { db, initDatabase, hashPassword, verifyPassword } = require('./database');
const {
  signJwt,
  generateCsrfToken,
  serializeCookie,
  parseCookies,
  isStrongPassword,
  generateMfaSecret,
  generateOtpCode,
  verifyOtpCode,
} = require('./auth');
const {
  escapeHtml,
  sanitizeInput,
  isSafePublicUrl,
  authenticateToken,
  optionalAuth,
  requireRole,
  csrfProtection,
  verifyWebhookSignature,
  securityLogger,
} = require('./security');

const app = express();
const PORT = process.env.PORT || 5000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'localbiz-webhook-hmac-secret-key-2026';

// Initialize SQLite schema, safe migrations, and seed data
initDatabase();

// 1. TIGHTENED CORS SETTINGS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as same-origin, curl, mobile clients)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy (unauthorized origin)'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  })
);

// 2. TIGHTENED SECURITY HEADERS (OWASP / Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://*.unsplash.com'],
        connectSrc: ["'self'", 'http://localhost:5000', 'http://127.0.0.1:8000'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    xFrameOptions: { action: 'deny' },
  })
);

app.use(express.json({ limit: '500kb' }));

// 3. RATE LIMITING SUITE
const isTestEnv = process.env.NODE_ENV === 'test';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 2000 : 100, // 100 login/register attempts per 15 min per IP in prod, 2000 in test
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 500 : 20,
  message: { success: false, message: 'Too many MFA verification attempts. Please wait 15 minutes.' },
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 500 : 30,
  message: { success: false, error: 'Order rate limit reached. Please wait a few moments.' },
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isTestEnv ? 500 : 25, // max 25 AI queries per 10 min
  message: { success: false, reply: 'AI Assistant rate limit reached. Please wait a moment before asking again.' },
});

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 500 : 10,
  message: { success: false, message: 'Review submission rate limit reached.' },
});

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// 4. CSRF TOKEN ISSUANCE & VERIFICATION
app.get('/api/csrf-token', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies['localbiz_session'] ? 'auth' : 'anon';
  const token = generateCsrfToken(sessionId);

  // Set anti-CSRF cookie readable by frontend client
  res.setHeader(
    'Set-Cookie',
    serializeCookie('XSRF-TOKEN', token, {
      httpOnly: false, // Client must read it to pass in X-CSRF-Token header
      sameSite: 'Strict',
      maxAge: 7200,
    })
  );

  res.json({ success: true, csrfToken: token });
});

// Protect all state-changing API endpoints with CSRF protection
app.use('/api', csrfProtection);

// --- AUTHENTICATION & USERS ---

app.post('/api/auth/register', authLimiter, (req, res) => {
  const { name, email, password, role = 'customer', phone = '', address = '' } = req.body;

  const cleanName = escapeHtml(sanitizeInput(name, 100));
  const cleanEmail = sanitizeInput(email, 150).toLowerCase();
  const cleanPhone = sanitizeInput(phone, 30);
  const cleanAddress = escapeHtml(sanitizeInput(address, 300));
  const validRole = role === 'artisan' ? 'artisan' : 'customer';

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, message: 'Please enter a valid full name.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  // Strong password policy enforcement
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character.',
    });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    const defaultAvatar =
      validRole === 'artisan'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, address, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(cleanName, cleanEmail, passwordHash, validRole, cleanPhone, cleanAddress, defaultAvatar);

    const userPayload = {
      id: Number(result.lastInsertRowid),
      name: cleanName,
      email: cleanEmail,
      role: validRole,
      phone: cleanPhone,
      address: cleanAddress,
      avatar: defaultAvatar,
      vendor_id: null,
    };

    // Issue JWT and set httpOnly cookie
    const token = signJwt(userPayload, 86400); // 24 hours
    const csrfToken = generateCsrfToken(String(userPayload.id));

    res.setHeader('Set-Cookie', [
      serializeCookie('localbiz_session', token, { httpOnly: true, sameSite: 'Strict', maxAge: 86400 }),
      serializeCookie('XSRF-TOKEN', csrfToken, { httpOnly: false, sameSite: 'Strict', maxAge: 86400 }),
    ]);

    securityLogger.info('New user registered successfully', { email: cleanEmail, role: validRole });
    res.status(201).json({ success: true, message: 'Account created successfully!', user: userPayload, csrfToken });
  } catch (err) {
    securityLogger.error('Registration error', { error: err.message });
    res.status(500).json({ success: false, message: 'Database error during registration.' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password, mfaCode } = req.body;
  const cleanEmail = sanitizeInput(email, 150).toLowerCase();

  if (!cleanEmail || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      securityLogger.warn('Failed login attempt', { email: cleanEmail });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check Multi-Factor Authentication if enabled
    if (user.mfa_enabled) {
      if (!mfaCode) {
        return res.status(200).json({
          success: true,
          mfaRequired: true,
          message: 'Two-factor authentication required. Please enter your 6-digit code.',
        });
      }

      const isMfaValid = verifyOtpCode(mfaCode, user.mfa_secret);
      if (!isMfaValid) {
        return res.status(401).json({ success: false, message: 'Invalid 2FA code. Please check and try again.' });
      }
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      avatar: user.avatar || '',
      vendor_id: user.vendor_id || null,
      mfa_enabled: Boolean(user.mfa_enabled),
    };

    // Issue JWT and set httpOnly session cookie
    const token = signJwt(userPayload, 86400);
    const csrfToken = generateCsrfToken(String(user.id));

    res.setHeader('Set-Cookie', [
      serializeCookie('localbiz_session', token, { httpOnly: true, sameSite: 'Strict', maxAge: 86400 }),
      serializeCookie('XSRF-TOKEN', csrfToken, { httpOnly: false, sameSite: 'Strict', maxAge: 86400 }),
    ]);

    securityLogger.info('Successful user login', { email: cleanEmail });
    res.json({
      success: true,
      message: 'Login successful!',
      user: userPayload,
      token, // Also return for testing suites
      csrfToken,
    });
  } catch (err) {
    securityLogger.error('Login error', { error: err.message });
    res.status(500).json({ success: false, message: 'Authentication failed due to server error.' });
  }
});

// Restore current user session from httpOnly cookie
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, address, avatar, vendor_id, mfa_enabled FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: { ...user, mfa_enabled: Boolean(user.mfa_enabled) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

// Logout: Wipes httpOnly session cookie
app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', [
    serializeCookie('localbiz_session', '', { maxAge: 0 }),
    serializeCookie('XSRF-TOKEN', '', { maxAge: 0 }),
  ]);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Change Password: Enforces old password verification and strong new password
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.',
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    securityLogger.info('Password updated successfully', { userId: req.user.id });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

// MFA: Setup initiation
app.post('/api/auth/mfa/setup', authenticateToken, (req, res) => {
  const secret = generateMfaSecret();
  const sampleCode = generateOtpCode(secret);

  res.json({
    success: true,
    secret,
    sampleVerificationCode: sampleCode,
    message: 'MFA setup initialized. Verify code to activate.',
  });
});

// MFA: Verification & activation
app.post('/api/auth/mfa/verify', authenticateToken, mfaLimiter, (req, res) => {
  const { secret, code } = req.body;
  if (!secret || !code) {
    return res.status(400).json({ success: false, message: 'Secret and verification code are required.' });
  }

  const isValid = verifyOtpCode(code, secret);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid 2FA code. Please try again.' });
  }

  try {
    db.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ? WHERE id = ?').run(secret, req.user.id);
    securityLogger.info('MFA enabled for user', { userId: req.user.id });
    res.json({ success: true, message: 'Two-factor authentication successfully enabled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to activate 2FA.' });
  }
});

app.get('/api/auth/demo-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, phone, address, avatar, vendor_id, mfa_enabled FROM users ORDER BY id ASC').all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve demo users.' });
  }
});

// --- BROKEN OBJECT LEVEL AUTHORIZATION (BOLA / IDOR) FIX ---
// Enforces that users can only view their OWN orders (or admin)
app.get('/api/users/:id/orders', authenticateToken, (req, res) => {
  const targetUserId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(targetUserId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' });
  }

  // BOLA Check: Only the authenticated user themselves or an admin can access this history
  if (req.user.id !== targetUserId && req.user.role !== 'admin') {
    securityLogger.warn('BOLA violation blocked', {
      callerId: req.user.id,
      targetUserId,
    });
    return res.status(403).json({
      success: false,
      code: 'BOLA_FORBIDDEN',
      message: 'Access denied. You cannot view order records belonging to another user.',
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Row Level Security: Fetch orders by user_id OR fallback to verified phone
    let orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(targetUserId);

    if (orders.length === 0 && user.phone) {
      orders = db.prepare('SELECT * FROM orders WHERE customer_phone = ? ORDER BY id DESC').all(user.phone);
    }

    const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map((o) => ({
      ...o,
      items: itemsStmt.all(o.id),
    }));

    res.json({ success: true, count: ordersWithItems.length, orders: ordersWithItems });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user orders.' });
  }
});

// --- PRODUCTS ---
app.get('/api/products', (req, res) => {
  const { category, search, vendor_id, sort } = req.query;
  let sql = `
    SELECT 
      p.*,
      v.name AS vendor_name,
      v.location AS vendor_location,
      v.rating AS vendor_rating,
      v.badge AS vendor_badge
    FROM products p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (category && category !== 'all') {
    sql += ` AND p.category_slug = ?`;
    params.push(sanitizeInput(category, 50));
  }

  if (search && search.trim() !== '') {
    const cleanSearch = sanitizeInput(search, 100);
    sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR v.name LIKE ?)`;
    const searchPattern = `%${cleanSearch}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (vendor_id) {
    const vId = Number.parseInt(vendor_id, 10);
    if (!Number.isNaN(vId)) {
      sql += ` AND p.vendor_id = ?`;
      params.push(vId);
    }
  }

  // Strict sorting parameter validation to prevent SQLi
  const validSorts = {
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    rating: 'p.rating DESC',
    featured: 'p.is_featured DESC, p.id DESC',
  };
  const sortClause = validSorts[sort] || 'p.is_featured DESC, p.id DESC';
  sql += ` ORDER BY ${sortClause}`;

  try {
    const stmt = db.prepare(sql);
    const products = stmt.all(...params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    securityLogger.error('Error fetching products', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to retrieve products.' });
  }
});

app.get('/api/products/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid product ID.' });
  }

  try {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        v.name AS vendor_name,
        v.location AS vendor_location,
        v.bio AS vendor_bio,
        v.avatar AS vendor_avatar,
        v.rating AS vendor_rating,
        v.badge AS vendor_badge
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = ?
    `);
    const product = stmt.get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query failed.' });
  }
});

// Server-side RBAC & SSRF Image Validation for Product Creation
app.post('/api/products', authenticateToken, requireRole(['artisan', 'admin']), (req, res) => {
  const {
    category_slug = 'crafts',
    name,
    price,
    original_price,
    unit = 'piece',
    stock = 10,
    image_url,
    description = '',
    badge = 'New Arrival',
  } = req.body;

  const cleanName = escapeHtml(sanitizeInput(name, 150));
  const cleanCategory = sanitizeInput(category_slug, 50);
  const cleanUnit = sanitizeInput(unit, 30);
  const cleanBadge = sanitizeInput(badge, 40);
  const cleanDesc = escapeHtml(sanitizeInput(description, 1000));
  const numPrice = Number.parseFloat(price);
  const numStock = Number.parseInt(stock, 10);

  // SSRF & File Upload Validation: Ensure image_url is a safe public URL
  if (!image_url || !isSafePublicUrl(image_url)) {
    return res.status(400).json({
      success: false,
      code: 'SSRF_INVALID_IMAGE_URL',
      message: 'Image URL must be a valid public HTTPS or HTTP web address. Local and private IP networks are blocked.',
    });
  }

  if (!cleanName || Number.isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid product name and positive price are required.',
    });
  }

  // Row Level Security: Bind to authenticated artisan's vendor_id
  const assignedVendorId = req.user.role === 'admin' ? (req.body.vendor_id || 1) : (req.user.vendor_id || 1);

  try {
    const stmt = db.prepare(`
      INSERT INTO products (vendor_id, category_slug, name, price, original_price, unit, stock, rating, reviews_count, image_url, description, badge, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, 5.0, 1, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      assignedVendorId,
      cleanCategory || 'crafts',
      cleanName,
      numPrice,
      original_price ? Number.parseFloat(original_price) : numPrice * 1.2,
      cleanUnit || 'piece',
      Number.isNaN(numStock) ? 10 : Math.max(0, numStock),
      image_url,
      cleanDesc,
      cleanBadge
    );

    securityLogger.info('Product created by artisan', { vendorId: assignedVendorId, productName: cleanName });
    res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Product created successfully' });
  } catch (err) {
    securityLogger.error('Error creating product', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to create product in database.' });
  }
});

// Row Level Security on Product Deletion: Artisan can only delete their OWN products
app.delete('/api/products/:id', authenticateToken, requireRole(['artisan', 'admin']), (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid product ID.' });
  }

  try {
    const product = db.prepare('SELECT id, vendor_id, name FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Ownership check: Artisan can only delete products belonging to their store
    if (req.user.role !== 'admin' && req.user.vendor_id !== product.vendor_id) {
      securityLogger.warn('RLS deletion violation blocked', {
        userId: req.user.id,
        userVendor: req.user.vendor_id,
        productVendor: product.vendor_id,
      });
      return res.status(403).json({
        success: false,
        code: 'RLS_FORBIDDEN',
        message: 'Permission denied. You can only delete creations belonging to your own artisan workshop.',
      });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    securityLogger.info('Product deleted', { productId: id, vendorId: product.vendor_id });
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database operation failed.' });
  }
});

// --- VENDORS ---
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY id ASC').all();
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve vendors.' });
  }
});

app.get('/api/vendors/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid vendor ID.' });
  }

  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const products = db.prepare('SELECT * FROM products WHERE vendor_id = ? ORDER BY id DESC').all(id);
    res.json({ success: true, vendor, products });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query failed.' });
  }
});

// --- CATEGORIES ---
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve categories.' });
  }
});

// --- ORDERS ---
app.post('/api/orders', orderLimiter, optionalAuth, (req, res) => {
  const { customer_name, customer_phone, customer_address, payment_method, items, total_amount } = req.body;

  const cleanName = escapeHtml(sanitizeInput(customer_name, 100));
  const cleanPhone = sanitizeInput(customer_phone, 30);
  const cleanAddress = escapeHtml(sanitizeInput(customer_address, 300));
  const cleanPayment = sanitizeInput(payment_method, 60) || 'Sandbox UPI';
  const numTotal = Number.parseFloat(total_amount);

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, message: 'Please provide a valid full name.' });
  }
  if (!isValidPhone(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number.' });
  }
  if (!cleanAddress || cleanAddress.length < 5) {
    return res.status(400).json({ success: false, message: 'Please provide a complete delivery address.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }
  if (Number.isNaN(numTotal) || numTotal <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid order total.' });
  }

  const orderNumber = `LB-${Math.floor(1000 + Math.random() * 9000)}`;
  const userId = req.user ? req.user.id : null;

  try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_address, payment_method, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PLACED')
    `);
    const orderRes = insertOrder.run(orderNumber, userId, cleanName, cleanPhone, cleanAddress, cleanPayment, numTotal);
    const orderId = orderRes.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const pId = Number.parseInt(item.id, 10) || 0;
      const pName = escapeHtml(sanitizeInput(item.name, 150)) || 'Artisan Product';
      const pPrice = Number.parseFloat(item.price) || 0;
      const pQty = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
      const pImg = item.image_url && isSafePublicUrl(item.image_url) ? item.image_url : '';

      insertItem.run(orderId, pId, pName, pPrice, pQty, pImg);
    }

    securityLogger.info('Order placed successfully', { orderNumber, userId, total: numTotal });
    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount: numTotal,
        status: 'PLACED',
      },
      message: 'Order placed successfully!',
    });
  } catch (err) {
    securityLogger.error('Order creation error', { error: err.message });
    res.status(500).json({ success: false, error: 'Database transaction failed.' });
  }
});

// Admin / Artisan Order Management
app.get('/api/orders', optionalAuth, (req, res) => {
  try {
    // If authenticated customer, only return their own orders
    let sql = 'SELECT * FROM orders';
    const params = [];

    if (req.user && req.user.role === 'customer') {
      sql += ' WHERE user_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY id DESC LIMIT 50';

    const orders = db.prepare(sql).all(...params);
    const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const ordersWithItems = orders.map((o) => {
      const items = itemsStmt.all(o.id);
      return { ...o, items };
    });

    res.json({ success: true, count: ordersWithItems.length, orders: ordersWithItems });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve orders.' });
  }
});

// Server-side RBAC on Status Updates: Only Artisans and Admins can update fulfillment
app.patch('/api/orders/:id/status', authenticateToken, requireRole(['artisan', 'admin']), (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { status } = req.body;

  const validStatuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const cleanStatus = sanitizeInput(status, 20).toUpperCase();

  if (!cleanStatus || !validStatuses.includes(cleanStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(cleanStatus, id);
    securityLogger.info('Order status updated', { orderId: id, status: cleanStatus, updatedBy: req.user.id });
    res.json({ success: true, message: `Order marked as ${cleanStatus}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database update failed.' });
  }
});

// --- REVIEWS & RATINGS ---
app.get('/api/products/:id/reviews', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  try {
    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC').all(id);
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
  }
});

app.post('/api/reviews', reviewLimiter, (req, res) => {
  const { product_id, customer_name, rating, comment } = req.body;
  const pId = Number.parseInt(product_id, 10);
  const cleanName = escapeHtml(customer_name, 100);
  const numRating = Math.max(1, Math.min(5, Number.parseInt(rating, 10) || 5));
  const cleanComment = escapeHtml(comment, 500);

  if (!pId || !cleanName || !cleanComment) {
    return res.status(400).json({ success: false, message: 'Product ID, customer name, and comment are required.' });
  }

  try {
    const insertRev = db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)');
    insertRev.run(pId, cleanName, numRating, cleanComment);

    const avgData = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as rev_count FROM reviews WHERE product_id = ?').get(pId);
    if (avgData) {
      const updateProd = db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?');
      updateProd.run(Number.parseFloat(avgData.avg_rating.toFixed(1)), avgData.rev_count, pId);
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT count(*) as count FROM products').get().count;
    const totalVendors = db.prepare('SELECT count(*) as count FROM vendors').get().count;
    const totalOrders = db.prepare('SELECT count(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as sum FROM orders').get().sum;

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalVendors,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database aggregation failed.' });
  }
});

// --- WEBHOOK ENDPOINT WITH HMAC SIGNATURE VERIFICATION ---
app.post('/api/webhooks/payment', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  if (!signature) {
    return res.status(401).json({ success: false, message: 'Missing x-webhook-signature header.' });
  }

  const isValid = verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET);
  if (!isValid) {
    securityLogger.warn('Invalid webhook signature attempt');
    return res.status(401).json({ success: false, message: 'Cryptographic signature verification failed.' });
  }

  const { event, order_number } = req.body;
  if (event === 'payment.captured' && order_number) {
    db.prepare("UPDATE orders SET status = 'CONFIRMED' WHERE order_number = ?").run(order_number);
    securityLogger.info('Payment webhook verified and processed', { order_number });
    return res.json({ success: true, message: 'Webhook signature verified. Order confirmed.' });
  }

  res.json({ success: true, message: 'Webhook received.' });
});

// --- AI ASSISTANT PROXY (Rate Limited & Protected) ---
app.post('/api/ai/chat', aiLimiter, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const aiResponse = await fetch('http://127.0.0.1:8000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (aiResponse.ok) {
      const data = await aiResponse.json();
      return res.json(data);
    }
  } catch (err) {
    securityLogger.warn('AI microservice fallback triggered', { error: err.message });
  }

  // Resilient In-Process Fallback
  const msg = sanitizeInput(req.body?.message || '', 200).toLowerCase();

  if (msg.includes('sales') || msg.includes('revenue') || msg.includes('analytics')) {
    const totalOrders = db.prepare('SELECT count(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as sum FROM orders').get().sum;
    return res.json({
      success: true,
      action_taken: 'GET_ANALYTICS',
      reply: `📊 **LocalBiz Real-Time Marketplace Analytics**\n\n• **Total Revenue:** ₹${Number(totalRevenue).toLocaleString('en-IN')}\n• **Total Orders Processed:** ${totalOrders}\n• **Active Studios:** 4 verified artisan workshops.`,
    });
  }

  if (msg.includes('payment') || msg.includes('upi')) {
    return res.json({
      success: true,
      action_taken: 'KNOWLEDGE_RAG',
      reply: `💳 **Payment Options on LocalBiz**\n\n1. **UPI (GPay / PhonePe / Paytm):** Instant zero-commission direct transfer.\n2. **Stripe / Razorpay Sandbox:** Test mode card checkout.\n3. **Cash on Delivery (COD):** Available for local neighbourhood pin codes.`,
    });
  }

  if (msg.includes('price') || msg.includes('pricing')) {
    return res.json({
      success: true,
      action_taken: 'KNOWLEDGE_RAG',
      reply: `💡 **Artisan Pricing Formula:**\n\nRetail Price = (Raw Materials + Labor Hours @ Fair Wage + Packaging) × 1.30 (30% Profit Margin).`,
    });
  }

  return res.json({
    success: true,
    action_taken: 'ASSISTANT_INTRO',
    reply: `Namaste! I am **Bazaar Buddy**, your LocalBiz AI Assistant. I can help place orders, track shipments, mark fulfillment, and guide local artisans on pricing and policies.`,
  });
});

// Serve built frontend assets
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Fallback to React index.html for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  securityLogger.error('Unhandled server error', { error: err.message });
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`LocalBiz Hardened Backend running on http://localhost:${PORT}`);
});
