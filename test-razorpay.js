const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE'
});

// Test order creation
const testOrder = async () => {
  try {
    const options = {
      amount: 10000,
      currency: 'INR',
      receipt: 'test_receipt',
      notes: {
        description: 'Test Order'
      }
    };

    console.log('Creating test order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Test order created successfully:', order);
  } catch (error) {
    console.error('Test order creation failed:', {
      message: error.message,
      error: error.error,
      stack: error.stack
    });
  }
};

testOrder(); 