const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE'
});

// Test payment verification
const testPaymentVerification = async () => {
  console.log('\n=== Testing Payment Verification ===');
  
  try {
    // First create a test order
    const orderOptions = {
      amount: 50000,  // ₹500 in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        description: "Test Order for Verification"
      }
    };

    console.log('Creating test order...');
    const order = await razorpay.orders.create(orderOptions);
    console.log('✅ Test order created:', order.id);

    // Simulate payment verification
    const paymentId = 'pay_test_' + Date.now();
    const orderId = order.id;
    
    // Generate signature as per documentation
    const sign = orderId + "|" + paymentId;
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE')
      .update(sign)
      .digest("hex");

    // Verify signature
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE')
      .update(sign)
      .digest("hex");

    console.log('\nVerification Details:');
    console.log('Order ID:', orderId);
    console.log('Payment ID:', paymentId);
    console.log('Generated Signature:', signature);
    console.log('Expected Signature:', expectedSign);

    if (signature === expectedSign) {
      console.log('✅ Payment verification successful');
      return true;
    } else {
      console.log('❌ Payment verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in payment verification test:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code,
      message: error.message
    });
    return false;
  }
};

// Test Razorpay instance configuration
const testRazorpayConfig = () => {
  console.log('\n=== Testing Razorpay Configuration ===');
  console.log('Key ID:', razorpay.key_id);
  console.log('API Version:', razorpay.version);
  console.log('Headers:', razorpay.headers);
};

// Run verification test
console.log('Starting Payment Verification Test...');
testRazorpayConfig();
testPaymentVerification().catch(error => {
  console.error('Test execution failed:', error);
}); 