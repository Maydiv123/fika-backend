const Razorpay = require('razorpay');
require('dotenv').config();

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: 'r3WxUOnCSmWAedhkRKHaXApE'
});

// Test API key validation
const testApiKey = async () => {
  console.log('\n=== Testing API Key Validation ===');
  try {
    const response = await razorpay.payments.all();
    console.log('✅ API Key is valid');
    console.log('Successfully fetched payments:', response.items.length);
  } catch (error) {
    console.error('❌ API Key validation failed:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code
    });
  }
};

// Test order creation
const testOrderCreation = async () => {
  console.log('\n=== Testing Order Creation ===');
  try {
    const options = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        description: 'Test Order'
      },
      payment_capture: 1
    };

    console.log('Creating order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('✅ Order created successfully');
    console.log('Order details:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    });
    return order;
  } catch (error) {
    console.error('❌ Error creating order:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code,
      message: error.message
    });
    return null;
  }
};

// Test order fetch
const testOrderFetch = async () => {
  console.log('\n=== Testing Order Fetch ===');
  try {
    const response = await razorpay.orders.all();
    console.log('✅ Successfully fetched orders');
    console.log('Total orders:', response.items.length);
    if (response.items.length > 0) {
      console.log('Latest order:', {
        id: response.items[0].id,
        amount: response.items[0].amount,
        currency: response.items[0].currency,
        status: response.items[0].status
      });
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code
    });
  }
};

// Test payment fetch
const testPaymentFetch = async () => {
  console.log('\n=== Testing Payment Fetch ===');
  try {
    const response = await razorpay.payments.all();
    console.log('✅ Successfully fetched payments');
    console.log('Total payments:', response.items.length);
    if (response.items.length > 0) {
      console.log('Latest payment:', {
        id: response.items[0].id,
        amount: response.items[0].amount,
        currency: response.items[0].currency,
        status: response.items[0].status
      });
    }
  } catch (error) {
    console.error('❌ Error fetching payments:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code
    });
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting Razorpay Integration Tests...');
  console.log('Using Key ID:', process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4');
  
  await testApiKey();
  const order = await testOrderCreation();
  await testOrderFetch();
  await testPaymentFetch();
  
  console.log('\n=== Test Summary ===');
  console.log('All tests completed. Check the results above for any errors.');
};

// Execute tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
}); 