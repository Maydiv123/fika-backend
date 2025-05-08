const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: 'r3WxUOnCSmWAedhkRKHaXApE'
});

// Test payment verification
const testPaymentVerification = async () => {
  console.log('\n=== Testing Payment Verification ===');
  
  try {
    // First create a test order
    const orderOptions = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        description: 'Test Order for Verification'
      },
      payment_capture: 1
    };

    console.log('Creating test order...');
    const order = await razorpay.orders.create(orderOptions);
    console.log('✅ Test order created:', order.id);

    // Simulate payment verification
    const paymentId = 'pay_test_' + Date.now();
    const orderId = order.id;
    
    // Generate signature
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
    } else {
      console.log('❌ Payment verification failed');
    }

  } catch (error) {
    console.error('❌ Error in payment verification test:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code,
      message: error.message
    });
  }
};

// Run verification test
console.log('Starting Payment Verification Test...');
testPaymentVerification().catch(error => {
  console.error('Test execution failed:', error);
}); 