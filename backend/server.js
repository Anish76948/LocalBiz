const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite schema and seeds
initDatabase();

// --- PRODUCTS ---
app.get('/api/products', (req, res) => {
  const { category, search, vendor_id } = req.query;
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
    params.push(category);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR v.name LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (vendor_id) {
    sql += ` AND p.vendor_id = ?`;
    params.push(Number(vendor_id));
  }

  sql += ` ORDER BY p.is_featured DESC, p.id DESC`;

  try {
    const stmt = db.prepare(sql);
    const products = stmt.all(...params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        v.name AS vendor_name,
        v.location AS vendor_location,
        v.bio AS vendor_bio,
        v.avatar AS vendor_avatar,
        v.rating AS vendor_rating
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = ?
    `);
    const product = stmt.get(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

  if (!name || !price || !image_url) {
    return res.status(400).json({ success: false, message: 'Name, price, and image URL are required.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO products (vendor_id, category_slug, name, price, original_price, unit, stock, rating, reviews_count, image_url, description, badge, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, 5.0, 1, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      Number(vendor_id),
      category_slug,
      name,
      Number(price),
      original_price ? Number(original_price) : Number(price) * 1.2,
      unit,
      Number(stock),
      image_url,
      description,
      badge
    );
    res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const stmt = db.prepare(`DELETE FROM products WHERE id = ?`);
    stmt.run(Number(req.params.id));
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- VENDORS ---
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY id ASC').all();
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- CATEGORIES ---
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ORDERS ---
app.post('/api/orders', (req, res) => {
  const { customer_name, customer_phone, customer_address, payment_method, items, total_amount } = req.body;

  if (!customer_name || !customer_phone || !customer_address || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Customer details and items are required.' });
  }

  const orderNumber = `LB-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, customer_name, customer_phone, customer_address, payment_method, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PLACED')
    `);
    const orderRes = insertOrder.run(
      orderNumber,
      customer_name,
      customer_phone,
      customer_address,
      payment_method || 'Sandbox UPI',
      Number(total_amount)
    );

    const orderId = orderRes.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        orderId,
        Number(item.id),
        item.name,
        Number(item.price),
        Number(item.quantity || 1),
        item.image_url || ''
      );
    }

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount,
        status: 'PLACED',
      },
      message: 'Order placed successfully!',
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  try {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(status, Number(req.params.id));
    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- AI ASSISTANT PROXY TO PYTHON MICROSERVICE (PORT 8000) ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const aiResponse = await fetch('http://127.0.0.1:8000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      return res.status(aiResponse.status).json({ success: false, error: err });
    }
    const data = await aiResponse.json();
    res.json(data);
  } catch (err) {
    console.error('Error forwarding to AI microservice:', err);
    res.status(503).json({ success: false, error: 'AI microservice unavailable on port 8000' });
  }
});

// Serve built frontend assets
const path = require('node:path');
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Fallback to React index.html for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LocalBiz Backend running on http://localhost:${PORT}`);
});

