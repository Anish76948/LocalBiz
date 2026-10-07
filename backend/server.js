const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('node:path');
const { db, initDatabase, hashPassword, verifyPassword } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite schema and seeds
initDatabase();

// 1. SECURITY HEADERS (OWASP / Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://*.unsplash.com'],
        connectSrc: ["'self'", 'http://localhost:5000', 'http://127.0.0.1:8000'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 2. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // max 30 orders per 15 min per IP
  message: { success: false, error: 'Order rate limit reached. Please wait a few moments.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // max 30 auth attempts per 15 min per IP
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

// Helper: Input Sanitization
function sanitizeString(str, maxLen = 255) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// --- AUTHENTICATION & USERS ---
app.post('/api/auth/register', authLimiter, (req, res) => {
  const { name, email, password, role = 'customer', phone = '', address = '' } = req.body;

  const cleanName = sanitizeString(name, 100);
  const cleanEmail = sanitizeString(email, 150).toLowerCase();
  const cleanPhone = sanitizeString(phone, 30);
  const cleanAddress = sanitizeString(address, 300);
  const validRole = role === 'artisan' ? 'artisan' : 'customer';

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, message: 'Please enter a valid full name.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
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

    const user = {
      id: Number(result.lastInsertRowid),
      name: cleanName,
      email: cleanEmail,
      role: validRole,
      phone: cleanPhone,
      address: cleanAddress,
      avatar: defaultAvatar,
    };

    res.status(201).json({ success: true, message: 'Account created successfully!', user });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, message: 'Database error during registration.' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = sanitizeString(email, 150).toLowerCase();

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
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Authentication failed due to server error.' });
  }
});

app.get('/api/auth/demo-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, phone, address, avatar FROM users ORDER BY id ASC').all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve demo users.' });
  }
});

app.get('/api/users/:id/orders', (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Match orders by customer phone or customer name
    let orders = [];
    if (user.phone) {
      orders = db.prepare('SELECT * FROM orders WHERE customer_phone = ? ORDER BY id DESC').all(user.phone);
    }
    if (orders.length === 0 && user.name) {
      orders = db.prepare('SELECT * FROM orders WHERE customer_name LIKE ? ORDER BY id DESC').all(`%${user.name}%`);
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
    params.push(sanitizeString(category, 50));
  }

  if (search && search.trim() !== '') {
    const cleanSearch = sanitizeString(search, 100);
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

  if (sort === 'price_asc') {
    sql += ` ORDER BY p.price ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY p.price DESC`;
  } else if (sort === 'rating') {
    sql += ` ORDER BY p.rating DESC`;
  } else {
    sql += ` ORDER BY p.is_featured DESC, p.id DESC`;
  }

  try {
    const stmt = db.prepare(sql);
    const products = stmt.all(...params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error fetching products:', err.message);
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

app.post('/api/products', (req, res) => {
  const {
    vendor_id = 1,
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

  const cleanName = sanitizeString(name, 150);
  const cleanCategory = sanitizeString(category_slug, 50);
  const cleanUnit = sanitizeString(unit, 30);
  const cleanBadge = sanitizeString(badge, 40);
  const cleanDesc = sanitizeString(description, 1000);
  const numPrice = Number.parseFloat(price);
  const numStock = Number.parseInt(stock, 10);
  const numVendor = Number.parseInt(vendor_id, 10);

  if (!cleanName || Number.isNaN(numPrice) || numPrice <= 0 || !image_url) {
    return res.status(400).json({
      success: false,
      message: 'Valid product name, positive price, and image URL are required.',
    });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO products (vendor_id, category_slug, name, price, original_price, unit, stock, rating, reviews_count, image_url, description, badge, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, 5.0, 1, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      numVendor || 1,
      cleanCategory || 'crafts',
      cleanName,
      numPrice,
      original_price ? Number.parseFloat(original_price) : numPrice * 1.2,
      cleanUnit || 'piece',
      Number.isNaN(numStock) ? 10 : Math.max(0, numStock),
      sanitizeString(image_url, 500),
      cleanDesc,
      cleanBadge
    );
    res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Product created successfully' });
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create product in database.' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid product ID.' });
  }

  try {
    const stmt = db.prepare(`DELETE FROM products WHERE id = ?`);
    stmt.run(id);
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
    const vendorStmt = db.prepare('SELECT * FROM vendors WHERE id = ?');
    const vendor = vendorStmt.get(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const prodStmt = db.prepare('SELECT * FROM products WHERE vendor_id = ? ORDER BY id DESC');
    const products = prodStmt.all(id);

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
app.post('/api/orders', orderLimiter, (req, res) => {
  const { customer_name, customer_phone, customer_address, payment_method, items, total_amount } = req.body;

  const cleanName = sanitizeString(customer_name, 100);
  const cleanPhone = sanitizeString(customer_phone, 30);
  const cleanAddress = sanitizeString(customer_address, 300);
  const cleanPayment = sanitizeString(payment_method, 60) || 'Sandbox UPI';
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

  try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, customer_name, customer_phone, customer_address, payment_method, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PLACED')
    `);
    const orderRes = insertOrder.run(orderNumber, cleanName, cleanPhone, cleanAddress, cleanPayment, numTotal);

    const orderId = orderRes.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const pId = Number.parseInt(item.id, 10) || 0;
      const pName = sanitizeString(item.name, 150) || 'Artisan Product';
      const pPrice = Number.parseFloat(item.price) || 0;
      const pQty = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
      const pImg = sanitizeString(item.image_url, 500);

      insertItem.run(orderId, pId, pName, pPrice, pQty, pImg);
    }

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
    console.error('Order creation error:', err.message);
    res.status(500).json({ success: false, error: 'Database transaction failed.' });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
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

app.patch('/api/orders/:id/status', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { status } = req.body;

  const validStatuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const cleanStatus = sanitizeString(status, 20).toUpperCase();

  if (!cleanStatus || !validStatuses.includes(cleanStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(cleanStatus, id);
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

app.post('/api/reviews', (req, res) => {
  const { product_id, customer_name, rating, comment } = req.body;
  const pId = Number.parseInt(product_id, 10);
  const cleanName = sanitizeString(customer_name, 100);
  const numRating = Math.max(1, Math.min(5, Number.parseInt(rating, 10) || 5));
  const cleanComment = sanitizeString(comment, 500);

  if (!pId || !cleanName || !cleanComment) {
    return res.status(400).json({ success: false, message: 'Product ID, customer name, and comment are required.' });
  }

  try {
    const insertRev = db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)');
    insertRev.run(pId, cleanName, numRating, cleanComment);

    // Recalculate average rating for product
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

// --- AI ASSISTANT PROXY (Dual Resilience: FastAPI + In-Process Fallback) ---
app.post('/api/ai/chat', async (req, res) => {
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
    console.log('AI microservice port 8000 fallback triggered:', err.message);
  }

  // Resilient In-Process Fallback: Directly handle key user intents without downtime
  const msg = sanitizeString(req.body?.message || '', 200).toLowerCase();

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
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`LocalBiz Backend running on http://localhost:${PORT}`);
});
