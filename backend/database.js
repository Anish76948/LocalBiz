const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'localbiz.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

const crypto = require('node:crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Initialize tables
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('customer', 'artisan', 'admin')) DEFAULT 'customer',
      phone TEXT,
      address TEXT,
      avatar TEXT,
      vendor_id INTEGER,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 18,
      avatar TEXT,
      bio TEXT,
      speciality TEXT,
      badge TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER,
      category_slug TEXT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      unit TEXT DEFAULT 'piece',
      stock INTEGER DEFAULT 25,
      rating REAL DEFAULT 4.9,
      reviews_count INTEGER DEFAULT 34,
      image_url TEXT NOT NULL,
      description TEXT,
      badge TEXT,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      payment_method TEXT DEFAULT 'UPI (Sandbox)',
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'PLACED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      price REAL,
      quantity INTEGER,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Safe migrations for security enhancements
  try { db.exec('ALTER TABLE users ADD COLUMN vendor_id INTEGER;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN mfa_secret TEXT;'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN user_id INTEGER;'); } catch {}

  // Seed sample data if empty
  const countVendors = db.prepare('SELECT count(*) as count FROM vendors').get();
  if (countVendors.count === 0) {
    seedData();
  }

  const countReviews = db.prepare('SELECT count(*) as count FROM reviews').get();
  if (countReviews.count === 0) {
    seedReviews();
  }

  const countUsers = db.prepare('SELECT count(*) as count FROM users').get();
  if (countUsers.count === 0) {
    seedUsers();
  }
}

function seedReviews() {
  const insertRev = db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)');
  insertRev.run(1, 'Sunita Mehta', 5, 'Exceptional finish! The matte stoneware glaze looks stunning on our dining table.');
  insertRev.run(1, 'Rohan Kapoor', 5, 'Heavy, durable and truly artisanal. Worth every rupee.');
  insertRev.run(2, 'Rajiv Verma', 5, 'Pure unadulterated forest honey. The honeycomb pieces taste divine with morning tea.');
  insertRev.run(3, 'Meera Iyer', 5, 'Fine organic weave, soft on skin, authentic Maheshwari craftsmanship.');
  insertRev.run(4, 'Kavita Deshmukh', 5, 'Authentic traditional Konkani recipe without chemical preservatives. Reminds me of my grandmother.');
  insertRev.run(5, 'Dr. Amit Sen', 5, 'Aromatic Kashmiri saffron kahwa, whole cardamom pods and crushed almonds. Superb blend.');
  insertRev.run(6, 'Vikramaditya S.', 5, 'Solid brass lost-wax diya with resonant temple acoustic tone. Pure heritage.');
}

function seedData() {
  console.log('Seeding initial marketplace data...');

  const insertVendor = db.prepare(`
    INSERT INTO vendors (name, slug, location, rating, reviews_count, avatar, bio, speciality, badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVendor.run(
    "Priya's Studio",
    'priyas-studio',
    'Jaipur, Rajasthan',
    5.0,
    142,
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=300&q=80',
    '3rd-generation terracotta and ceramic studio creating handcrafted stoneware.',
    'Studio Ceramics & Stoneware',
    'Master Artisan'
  );

  insertVendor.run(
    "Aaji's Kitchen",
    'aajis-kitchen',
    'Pune, Maharashtra',
    4.9,
    98,
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80',
    'Authentic Maharashtrian homemade pickles, sun-dried masalas and festive snacks.',
    'Traditional Home Food',
    'Verified Cook'
  );

  insertVendor.run(
    'Satpura Honeycomb Apiaries',
    'satpura-apiaries',
    'Hoshangabad, MP',
    4.9,
    76,
    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80',
    'Wild multi-flora raw forest honey and organic bee products gathered with tribal co-ops.',
    'Pure Forest Honey',
    '100% Organic'
  );

  insertVendor.run(
    'Maheshwar Heritage Weaves',
    'maheshwar-weaves',
    'Khargone, MP',
    4.8,
    115,
    'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=300&q=80',
    'Handloom cotton and zari-bordered textiles woven on traditional wooden pit looms.',
    'Handloom Cotton & Silk',
    'GI Tagged Craft'
  );

  // Categories
  const insertCat = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
  insertCat.run('Ceramics & Pottery', 'ceramics');
  insertCat.run('Organic Food & Spices', 'food');
  insertCat.run('Handloom Textiles', 'textiles');
  insertCat.run('Woodcraft & Metal', 'crafts');

  // Products
  const insertProduct = db.prepare(`
    INSERT INTO products (vendor_id, category_slug, name, price, original_price, unit, stock, rating, reviews_count, image_url, description, badge, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Product 1: Ceramic Tableware Set
  insertProduct.run(
    1,
    'ceramics',
    'Handcrafted Ceramic Tableware & Dinner Set',
    1299,
    1699,
    'set of 3',
    18,
    4.9,
    48,
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    'Wheel-thrown ceramic soup bowl, side cup, and serving plate with a dual-tone matte sandstone glaze. Food-safe, microwave and dishwasher safe.',
    'Artisan Pick',
    1
  );

  // Product 2: Raw Forest Honeycomb
  insertProduct.run(
    3,
    'food',
    'Pure Forest Raw Honeycomb & Wild Nectar',
    449,
    550,
    '350g jar',
    24,
    5.0,
    32,
    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    'Raw unprocessed honey straight from Satpura forest hives with chunks of edible raw comb. Rich in natural bee pollen and enzymes.',
    '100% Organic',
    1
  );

  // Product 3: Handloom Cotton Textiles
  insertProduct.run(
    4,
    'textiles',
    'Handloom Cotton Woven Shawl & Fringed Throw',
    899,
    1200,
    'piece',
    15,
    4.8,
    64,
    'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
    'Woven from fine combed organic cotton on traditional wooden looms. Features timeless indigo stripes and hand-twisted fringe details.',
    'Handwoven',
    1
  );

  // Product 4: Aaji Mango Pickle
  insertProduct.run(
    2,
    'food',
    'Aaji Traditional Sun-Dried Raw Mango Pickle',
    299,
    380,
    '300g glass jar',
    30,
    4.9,
    89,
    'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=800&q=80',
    'Prepared with hand-cut Rajapuri raw mangoes, cold-pressed mustard oil, and authentic home-pounded Konkani spices without chemical preservatives.',
    'Bestseller',
    1
  );

  // Product 5: Royal Saffron & Spices
  insertProduct.run(
    2,
    'food',
    'Artisanal Kashmiri Kahwa Tea Blend & Pure Saffron',
    649,
    800,
    '150g tin',
    20,
    4.9,
    41,
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    'Hand-picked Mongra saffron strands mixed with green tea leaves, whole green cardamom, cinnamon bark, and crushed roasted almonds.',
    'Heritage',
    0
  );

  // Product 6: Brass Temple Bell & Diya
  insertProduct.run(
    1,
    'crafts',
    'Lost-Wax Cast Solid Brass Pooja Diya & Bell',
    780,
    950,
    'piece',
    12,
    5.0,
    19,
    'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
    'Hand-cast using centuries-old Dhokra bell metal technique. Emits a resonant acoustic frequency and features an ornate peacock crest.',
    'Limited',
    0
  );

  console.log('Seeding complete! 4 vendors, 6 artisan products ready.');
}

function seedUsers() {
  console.log('Seeding demo authentication accounts...');
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, address, avatar, vendor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoPassHash = hashPassword('Pass@123');

  insertUser.run(
    'Aditi Khandge',
    'aditi@tcet.edu',
    demoPassHash,
    'customer',
    '9820123456',
    'Thakur Village, Kandivali East, Mumbai 400101',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    null
  );

  insertUser.run(
    'Anish',
    'anish@tcet.edu',
    demoPassHash,
    'customer',
    '9876543210',
    'Bandra West, Mumbai 400050',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    null
  );

  insertUser.run(
    'Priya Sharma',
    'priya@pottery.in',
    demoPassHash,
    'artisan',
    '9812345678',
    'Amber Road Studio, Jaipur, Rajasthan 302001',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    1
  );

  insertUser.run(
    'Aaji Parulekar',
    'aaji@kitchen.in',
    demoPassHash,
    'artisan',
    '9822334455',
    'Ratnagiri, Maharashtra 415612',
    'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=200&q=80',
    2
  );
}

// Update existing records for vendor bindings if already seeded
try {
  db.exec("UPDATE users SET vendor_id = 1 WHERE email = 'priya@pottery.in' AND vendor_id IS NULL;");
  db.exec("UPDATE users SET vendor_id = 2 WHERE email = 'aaji@kitchen.in' AND vendor_id IS NULL;");
} catch {}

module.exports = {
  db,
  initDatabase,
  hashPassword,
  verifyPassword,
};
