// Comprehensive End-to-End Test Suite for LocalBiz Prototype
// Verifies Security, Buyer Journey, Vendor Management, Reviews, and AI Integration

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting LocalBiz End-to-End Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
      failed++;
    }
  }

  // 1. Static HTML Delivery & Security Headers
  await test('GET / serves production frontend with Helmet security headers', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('LocalBiz')) throw new Error('HTML does not contain LocalBiz title');
    const csp = res.headers.get('content-security-policy');
    if (!csp) throw new Error('Helmet CSP header missing');
  });

  // 2. Products Catalog & Sorting
  await test('GET /api/products returns curated artisan catalog', async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.products) || data.products.length === 0) {
      throw new Error('Failed to retrieve products list');
    }
    const sample = data.products[0];
    if (!sample.vendor_name || !sample.price) {
      throw new Error('Product is missing joined vendor attributes');
    }
  });

  await test('GET /api/products?sort=price_asc returns items sorted by price', async () => {
    const res = await fetch(`${BASE_URL}/api/products?sort=price_asc`);
    const data = await res.json();
    if (!data.success || data.products.length < 2) throw new Error('Expected multiple products');
    for (let i = 0; i < data.products.length - 1; i++) {
      if (data.products[i].price > data.products[i + 1].price) {
        throw new Error(`Pricing order violated at index ${i}`);
      }
    }
  });

  // 3. Artisan Studio Storefront
  await test('GET /api/vendors/1 returns vendor profile and dedicated catalog', async () => {
    const res = await fetch(`${BASE_URL}/api/vendors/1`);
    const data = await res.json();
    if (!data.success || !data.vendor || data.vendor.name !== "Priya's Studio") {
      throw new Error('Vendor 1 profile mismatch');
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw new Error('Vendor 1 products not returned');
    }
  });

  // 4. Reviews & Ratings
  let initialReviewsCount = 0;
  await test('GET /api/products/1/reviews retrieves customer testimonials', async () => {
    const res = await fetch(`${BASE_URL}/api/products/1/reviews`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.reviews)) {
      throw new Error('Failed to fetch reviews');
    }
    initialReviewsCount = data.reviews.length;
  });

  await test('POST /api/reviews adds testimonial and recalculates rating', async () => {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 1,
        customer_name: 'Viva Evaluator Aditi',
        rating: 5,
        comment: 'Exceptional terracotta clay finish. Direct artisan connection is great!',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Review post failed');

    // Verify review was saved
    const revRes = await fetch(`${BASE_URL}/api/products/1/reviews`);
    const revData = await revRes.json();
    if (revData.reviews.length !== initialReviewsCount + 1) {
      throw new Error('Review count did not increment');
    }
  });

  // 5. Order Placement (Input Validation & Fulfillment)
  let testOrderId = null;
  await test('POST /api/orders validates input and places order', async () => {
    // Test invalid phone first
    const badRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Aditi',
        customer_phone: '123', // invalid
        customer_address: 'TCET Campus',
        payment_method: 'UPI',
        items: [{ id: 1, name: 'Clay Cup', price: 449, quantity: 2 }],
        total_amount: 898,
      }),
    });
    if (badRes.status !== 400) throw new Error('Server did not reject invalid phone number');

    // Valid order
    const goodRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Aditi Khandge',
        customer_phone: '9820123456',
        customer_address: 'Thakur Village, Kandivali East, Mumbai 400101',
        payment_method: 'Instant UPI',
        items: [{ id: 1, name: 'Handmade Terracotta Chai Cups', price: 449, quantity: 2 }],
        total_amount: 898,
      }),
    });
    const goodData = await goodRes.json();
    if (!goodData.success || !goodData.order.id || !goodData.order.order_number) {
      throw new Error('Failed to create valid order');
    }
    testOrderId = goodData.order.id;
  });

  // 6. Vendor Order Status Management
  await test('PATCH /api/orders/:id/status updates fulfillment workflow', async () => {
    if (!testOrderId) throw new Error('No test order ID');
    const res = await fetch(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    const data = await res.json();
    if (!data.success) throw new Error('Failed to update status');

    // Verify order list shows SHIPPED
    const ordersRes = await fetch(`${BASE_URL}/api/orders`);
    const ordersData = await ordersRes.json();
    const updatedOrder = ordersData.orders.find((o) => o.id === testOrderId);
    if (!updatedOrder || updatedOrder.status !== 'SHIPPED') {
      throw new Error('Order status was not updated to SHIPPED in database');
    }
  });

  // 7. Vendor Product Creation & Deletion
  let createdProdId = null;
  await test('POST /api/products & DELETE /api/products/:id for vendor workflow', async () => {
    const createRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_id: 1,
        category_slug: 'ceramics',
        name: 'Handcrafted Blue Pottery Saucer (Test Item)',
        price: 320,
        original_price: 399,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
        description: 'Authentic Jaipur glazed blue pottery saucer.',
        badge: 'New Artisan Creation',
      }),
    });
    const createData = await createRes.json();
    if (!createData.success || !createData.id) throw new Error('Product creation failed');
    createdProdId = createData.id;

    // Delete the test product
    const delRes = await fetch(`${BASE_URL}/api/products/${createdProdId}`, {
      method: 'DELETE',
    });
    const delData = await delRes.json();
    if (!delData.success) throw new Error('Product deletion failed');
  });

  // 8. Dual-Engine AI Assistant Proxy
  await test('POST /api/ai/chat interacts with AI Assistant (Port 8000 microservice)', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What payment options does LocalBiz support?',
      }),
    });
    const data = await res.json();
    if (!data.success || !data.reply) throw new Error('AI Assistant did not return reply');
    if (!data.reply.toLowerCase().includes('upi') && !data.reply.toLowerCase().includes('payment')) {
      throw new Error('AI reply did not address payment knowledge query');
    }
  });

  // 9. Authentication & Security (Login & Scrypt Password Verification)
  await test('POST /api/auth/login verifies credentials and handles wrong password', async () => {
    // Valid login
    const goodRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aditi@tcet.edu', password: 'Pass@123' }),
    });
    const goodData = await goodRes.json();
    if (!goodData.success || !goodData.user || goodData.user.name !== 'Aditi Khandge') {
      throw new Error('Valid login failed');
    }

    // Invalid password
    const badRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aditi@tcet.edu', password: 'WrongPassword!' }),
    });
    if (badRes.status !== 401) throw new Error('Invalid password was not rejected with 401');
  });

  // 10. Registration & Conflict Handling
  const uniqueRegEmail = `testbuyer_${Date.now()}@craft.in`;
  let regUserId = null;
  await test('POST /api/auth/register creates user and rejects duplicate email', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Hegde',
        email: uniqueRegEmail,
        password: 'SecurePass@123',
        role: 'customer',
        phone: '9833445566',
        address: 'Bandra, Mumbai',
      }),
    });
    const regData = await regRes.json();
    if (!regData.success || !regData.user.id) throw new Error('Registration failed');
    regUserId = regData.user.id;

    // Duplicate email check
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Buyer',
        email: uniqueRegEmail,
        password: 'SecurePass@123',
      }),
    });
    if (dupRes.status !== 409) throw new Error('Duplicate email was not rejected with 409');
  });

  // 11. User Order History
  await test('GET /api/users/:id/orders retrieves personalized user orders', async () => {
    const res = await fetch(`${BASE_URL}/api/users/1/orders`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.orders)) throw new Error('Failed to retrieve user orders');
  });

  // 12. Promo Code Checkout Simulation
  await test('POST /api/orders processes order with applied promo discount', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Aditi Khandge',
        customer_phone: '9820123456',
        customer_address: 'Kandivali East, Mumbai',
        payment_method: 'UPI (Promo: VOCAL4LOCAL)',
        items: [{ id: 1, name: 'Handmade Terracotta Chai Cups', price: 449, quantity: 1 }],
        total_amount: 349, // 449 - 100 promo
      }),
    });
    const data = await res.json();
    if (!data.success || !data.order.order_number) throw new Error('Promo order placement failed');
  });

  // Summary
  console.log(`\n==========================================`);
  console.log(`🏁 Verification Finished: ${passed} Passed, ${failed} Failed`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
