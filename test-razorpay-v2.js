// Load environment and initialize Razorpay SDK
const Razorpay = require('razorpay');

// Initialize Razorpay with hardcoded test credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: 'r3WxUOnCSmWAedhkRKHaXApE'
});

// Helper to sanitize strings
const sanitize = (str = '', maxLen = 256) =>
  String(str)
    // remove non-ASCII characters
    .replace(/[^\x00-\x7F]/g, '')
    // enforce max length
    .slice(0, maxLen);

// Test Configuration
const testRazorpayConfig = () => {
  console.log('--- Razorpay Config ---');
  console.log('Key ID:', razorpay.key_id);
  console.log('Key Secret:', '*** (hardcoded)');
  console.log('Library Version:', razorpay.version || 'unknown');
  console.log('-----------------------');
};

// 1. API Key Validation
const testApiKey = async () => {
  console.log('\n=== Testing API Key Validation ===');
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    console.log(`Fetching payments from ${from} to ${to}...`);
    const response = await razorpay.payments.all({ from, to });
    console.log('✅ API Key valid, fetched payments:', response.items.length);
    return true;
  } catch (err) {
    logError('API Key Validation', err);
    return false;
  }
};

// 2. Order Creation with debug logs
const testOrderCreation = async () => {
  console.log('\n=== Testing Order Creation ===');
  try {
    const rawReceipt = `receipt_${Date.now()}`;
    const rawNote = 'Test Order – verify 🚀';

    // Sanitize inputs
    const receipt = sanitize(rawReceipt, 40);
    const description = sanitize(rawNote, 256);

    const options = {
      amount: 50000,        // INR paise
      currency: 'INR',
      receipt,
      notes: { description }
    };

    console.log('Order payload:', options);

    // Generate idempotency key
    const idempotencyKey = `order_${Date.now()}`;
    console.log('Idempotency-Key:', idempotencyKey);

    const order = await razorpay.orders.create(options, {
      headers: { 'Idempotency-Key': idempotencyKey }
    });

    console.log('✅ Order created:', order.id);
    console.log('Full Order Response:', order);
    return order;
  } catch (err) {
    logError('Order Creation', err);
    return null;
  }
};

// 3. Fetch Orders Debug
const testOrderFetch = async () => {
  console.log('\n=== Testing Order Fetch ===');
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    const options = { from, to, count: 10, skip: 0 };

    console.log('Fetching orders with params:', options);
    const response = await razorpay.orders.all(options);

    console.log('✅ Fetched orders:', response.items.length);
    if (response.items.length) console.log('Latest order:', response.items[0]);
  } catch (err) {
    logError('Order Fetch', err);
  }
};

// 4. Fetch Payments Debug
const testPaymentFetch = async () => {
  console.log('\n=== Testing Payment Fetch ===');
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    const options = { from, to, count: 10, skip: 0 };

    console.log('Fetching payments with params:', options);
    const response = await razorpay.payments.all(options);

    console.log('✅ Fetched payments:', response.items.length);
    if (response.items.length) console.log('Latest payment:', response.items[0]);
  } catch (err) {
    logError('Payment Fetch', err);
  }
};

// Runner
const runTests = async () => {
  console.log('Starting Razorpay Integration Debug Tests...');
  testRazorpayConfig();

  const apiOk = await testApiKey();
  if (!apiOk) {
    console.warn('❌ Aborting further tests due to invalid API key.');
    return;
  }

  await testOrderCreation();
  await testOrderFetch();
  await testPaymentFetch();

  console.log('\n=== Debug Test Run Complete ===');
};

runTests().catch(err => logError('Runner', err));
