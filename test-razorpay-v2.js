const Razorpay = require('razorpay');
require('dotenv').config();

// Test keys - Replace these with your actual test keys from Razorpay Dashboard
const TEST_KEY_ID = 'rzp_test_2LKLmubQ5uu0M4';
const TEST_KEY_SECRET = 'r3WxUOnCSmWAedhkRKHaXApE';

const razorpay = new Razorpay({
  key_id: TEST_KEY_ID,
  key_secret: TEST_KEY_SECRET
});

// Test order creation with minimal options
const testOrder = async () => {
  try {
    const options = {
      amount: 10000,
      currency: 'INR'
    };

    console.log('Test Configuration:');
    console.log('Key ID:', TEST_KEY_ID);
    console.log('Amount:', options.amount);
    console.log('Currency:', options.currency);

    // Create order using callback
    razorpay.orders.create(options, (err, order) => {
      if (err) {
        console.error('Error creating order:', {
          error: err.error,
          description: err.error?.description,
          code: err.error?.code
        });
        return;
      }
      console.log('Order created successfully:', order);
    });
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Test API key validation
const testApiKey = async () => {
  try {
    const response = await razorpay.payments.all();
    console.log('API Key is valid. Successfully fetched payments.');
  } catch (error) {
    console.error('API Key validation failed:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code
    });
  }
};

// Run tests
console.log('Starting Razorpay tests...');
testApiKey();
testOrder(); 