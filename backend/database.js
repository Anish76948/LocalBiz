const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'localbiz.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDatabase() {
  db.exec(`
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
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      payment_method TEXT DEFAULT 'UPI (Sandbox)',
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'PLACED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  `);

  // Seed sample data if empty
  const countVendors = db.prepare('SELECT count(*) as count FROM vendors').get();
  if (countVendors.count === 0) {
    seedData();
  }
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

module.exports = {
  db,
  initDatabase,
};
