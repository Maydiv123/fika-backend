// Initialize Razorpay SDK and Crypto
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Hardcoded Test Credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: 'r3WxUOnCSmWAedhkRKHaXApE'
});


// Sanitize helper: remove non-ASCII, enforce max length
const sanitize = (str = '', maxLen = 256) =>
  String(str)
    // remove non-ASCII characters
    .replace(/[^\x00-\x7F]/g, '')
    // enforce max length
    .slice(0, maxLen);

// Universal error logger with context, HTTP status, Razorpay-Request-Id, and stack
const logError = (context, err) => {
  console.error(`❌ [${context}] Message:`, err.message);
  if (err.error) console.error(`   ↳ API Error:`, err.error);
  if (err.statusCode) console.error(`   ↳ HTTP Status Code:`, err.statusCode);
  if (err.requestId) console.error(`   ↳ Razorpay-Request-Id:`, err.requestId);
  console.error(`   ↳ Stack Trace:`, err.stack);
};

// Debug: Config details
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
    const from = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    console.log(`Fetching payments from ${from} to ${to}...`);
    const response = await razorpay.payments.all({ from, to });
    console.log('✅ API Key valid, payments fetched:', response.items.length);
    return true;
  } catch (err) {
    logError('API Key Validation', err);
    return false;
  }
};

// 2. Order Creation with detailed debug logs
const testOrderCreation = async () => {
  console.log('\n=== Testing Order Creation ===');
  try {
    const rawReceipt = `receipt_${Date.now()}`;
    const rawNote = 'Test Order – verify 🚀';

    const receipt = sanitize(rawReceipt, 40);
    const description = sanitize(rawNote, 256);

    const options = { amount: 50000, currency: 'INR', receipt, notes: { description } };
    console.log('Order payload:', options);

    const idempotencyKey = `order_${Date.now()}`;
    console.log('Idempotency-Key:', idempotencyKey);

    const order = await razorpay.orders.create(options, { headers: { 'Idempotency-Key': idempotencyKey } });
    console.log('✅ Order created:', order.id);
    console.log('Full Order Response:', order);
    return order;
  } catch (err) {
    logError('Order Creation', err);
    return null;
  }
};

// 3. Payment Verification with detailed logs
const testPaymentVerification = async () => {
  console.log('\n=== Testing Payment Verification ===');
  try {
    // 3.1 Create test order
    const orderOptions = {
      amount: 50000,
      currency: 'INR',
      receipt: sanitize(`receipt_${Date.now()}`, 40),
      notes: { description: sanitize('Test Order for Verification', 256) }
    };
    console.log('Creating test order with options:', orderOptions);
    const order = await razorpay.orders.create(orderOptions, { headers: { 'Idempotency-Key': `verify_${Date.now()}` } });
    console.log('✅ Test order created:', order.id);

    // 3.2 Simulate payment
    const paymentId = `pay_${Date.now()}`;
    console.log('Simulated Payment ID:', paymentId);
    const signInput = `${order.id}|${paymentId}`;
    console.log('Signature Input String:', signInput);

    // 3.3 Generate & verify signature
    const hmac = crypto.createHmac('sha256', razorpay.key_secret);
    const generatedSig = hmac.update(signInput).digest('hex');
    console.log('Generated Signature:', generatedSig);

    // Recompute to compare
    const verifyHmac = crypto.createHmac('sha256', razorpay.key_secret);
    const expectedSig = verifyHmac.update(signInput).digest('hex');
    console.log('Expected Signature:', expectedSig);

    if (generatedSig === expectedSig) {
      console.log('✅ Signature verification successful');
      return true;
    } else {
      console.log('❌ Signature mismatch');
      return false;
    }
  } catch (err) {
    logError('Payment Verification', err);
    return false;
  }
};

// Runner
const runTests = async () => {
  console.log('Starting Razorpay Integration Debug Tests...');
  testRazorpayConfig();

  const apiOk = await testApiKey();
  if (!apiOk) {
    console.warn('❌ Invalid API key; aborting further tests');
    return;
  }

  await testOrderCreation();
  await testPaymentVerification();

  console.log('\n=== Debug Test Run Complete ===');
};

runTests().catch(err => logError('Runner', err));
