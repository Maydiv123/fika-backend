const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Test keys - Replace these with your actual test keys from Razorpay Dashboard
const TEST_KEY_ID = 'rzp_test_05BxV9TnB6Qc7g';
const TEST_KEY_SECRET = 'J6wyqGXN02nsAAZm8w9Ivzjm';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: TEST_KEY_ID,
  key_secret: TEST_KEY_SECRET
});

const paymentController = {
    // Get Razorpay Key
    getRazorpayKey: (req, res) => {
        res.json({
            key: TEST_KEY_ID
        });
    },

    // Create Order
    createOrder: async (req, res) => {
        try {
            console.log('Create Order Request Body:', req.body);
            
            const { amount, currency = "INR" } = req.body;
            
            if (!amount || isNaN(amount) || amount <= 0) {
                return res.status(400).json({ 
                    error: 'Invalid amount',
                    receivedAmount: amount 
                });
            }

            const options = {
                amount: amount,
                currency: currency
            };

            console.log('Creating order with options:', options);

            // Create order using callback
            razorpay.orders.create(options, (err, order) => {
                if (err) {
                    console.error('Razorpay order creation error:', {
                        error: err.error,
                        description: err.error?.description,
                        code: err.error?.code
                    });
                    return res.status(500).json({
                        error: 'Razorpay API Error',
                        details: err.error?.description || 'Error creating order',
                        code: err.error?.code
                    });
                }
                console.log('Order created successfully:', order);
                res.json(order);
            });
        } catch (error) {
            console.error('Unexpected error:', error);
            res.status(500).json({ 
                error: 'Server Error',
                details: error.message
            });
        }
    },

    // Verify Payment
    verifyPayment: (req, res) => {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({
                    error: 'Missing required payment verification fields'
                });
            }

            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", TEST_KEY_SECRET)
                .update(sign)
                .digest("hex");

            if (razorpay_signature === expectedSign) {
                res.json({
                    success: true,
                    message: "Payment verified successfully"
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: "Invalid signature"
                });
            }
        } catch (error) {
            console.error('Error in verifyPayment:', error);
            res.status(500).json({ 
                error: 'Error verifying payment',
                details: error.message 
            });
        }
    }
};

module.exports = paymentController; 