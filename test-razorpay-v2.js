const Razorpay = require('razorpay');
require('dotenv').config();

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE'
});

// Test API key validation
const testApiKey = async () => {
  console.log('\n=== Testing API Key Validation ===');
  try {
    // Using payments.all() as per documentation to validate API key
    const response = await razorpay.payments.all({
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 24 hours
      to: new Date().toISOString().split('T')[0]
    });
    console.log('✅ API Key is valid');
    console.log('Successfully fetched payments:', response.items.length);
    return true;
  } catch (error) {
    console.error('❌ API Key validation failed:', {
      error: error.error,
      description: error.error?.description,
      code: error.error?.code
    });
    return false;
  }
};

// Test order creation
const testOrderCreation = async () => {
  console.log('\n=== Testing Order Creation ===');
  try {
    // Amount should be in smallest currency unit (paise for INR)
    const options = {
      amount: 50000,  // ₹500 in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        description: "Test Order"
      }
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

// Test order fetch with proper parameters
const testOrderFetch = async () => {
  console.log('\n=== Testing Order Fetch ===');
  try {
    const options = {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 24 hours
      to: new Date().toISOString().split('T')[0],
      count: 10,
      skip: 0
    };
    
    const response = await razorpay.orders.all(options);
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

// Test payment fetch with proper parameters
const testPaymentFetch = async () => {
  console.log('\n=== Testing Payment Fetch ===');
  try {
    const options = {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 24 hours
      to: new Date().toISOString().split('T')[0],
      count: 10,
      skip: 0
    };
    
    const response = await razorpay.payments.all(options);
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

// Test Razorpay instance configuration
const testRazorpayConfig = () => {
  console.log('\n=== Testing Razorpay Configuration ===');
  console.log('Key ID:', razorpay.key_id);
  console.log('API Version:', razorpay.version);
  console.log('Headers:', razorpay.headers);
};

// Run all tests
const runTests = async () => {
  console.log('Starting Razorpay Integration Tests...');
  console.log('Using Key ID:', process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4');
  
  // Test configuration first
  testRazorpayConfig();
  
  // Run API key validation
  const isApiKeyValid = await testApiKey();
  
  if (isApiKeyValid) {
    // Only proceed with other tests if API key is valid
    const order = await testOrderCreation();
    await testOrderFetch();
    await testPaymentFetch();
  } else {
    console.log('\n❌ Skipping remaining tests due to invalid API key');
  }
  
  console.log('\n=== Test Summary ===');
  console.log('All tests completed. Check the results above for any errors.');
};

// Execute tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
}); 