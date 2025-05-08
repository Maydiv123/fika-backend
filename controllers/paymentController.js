const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE'
});

const paymentController = {
    // Get Razorpay Key
    getRazorpayKey: (req, res) => {
        res.json({
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4'
        });
    },

    // Create Order
    createOrder: async (req, res) => {
        try {
            // Log the incoming request
            console.log('Create Order Request Body:', req.body);
            console.log('Create Order Headers:', req.headers);

            const { amount, currency = "INR" } = req.body;
            
            // Validate amount
            if (!amount) {
                console.error('Amount is missing in request');
                return res.status(400).json({ 
                    error: 'Amount is required',
                    receivedBody: req.body 
                });
            }

            if (isNaN(amount) || amount <= 0) {
                console.error('Invalid amount:', amount);
                return res.status(400).json({ 
                    error: 'Invalid amount. Must be a positive number',
                    receivedAmount: amount 
                });
            }

            const options = {
                amount: parseInt(amount), // Ensure amount is an integer
                currency,
                receipt: `order_${Date.now()}`,
            };

            console.log('Creating Razorpay order with options:', options);
            console.log('Using Razorpay key:', process.env.RAZORPAY_KEY_ID || 'rzp_test_2LKLmubQ5uu0M4');

            try {
                const order = await razorpay.orders.create(options);
                console.log('Order created successfully:', order);
                res.json(order);
            } catch (razorpayError) {
                console.error('Razorpay API Error:', {
                    message: razorpayError.message,
                    error: razorpayError.error,
                    statusCode: razorpayError.statusCode,
                    details: razorpayError.error?.description
                });
                res.status(500).json({ 
                    error: 'Razorpay API Error',
                    details: razorpayError.error?.description || razorpayError.message,
                    statusCode: razorpayError.statusCode
                });
            }
        } catch (error) {
            console.error('Unexpected error in createOrder:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            res.status(500).json({ 
                error: 'Error creating order',
                details: error.message,
                type: error.name
            });
        }
    },

    // Verify Payment
    verifyPayment: (req, res) => {
        try {
            console.log('Verify Payment Request Body:', req.body);
            
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({
                    error: 'Missing required payment verification fields',
                    receivedBody: req.body
                });
            }

            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'r3WxUOnCSmWAedhkRKHaXApE')
                .update(sign)
                .digest("hex");

            if (razorpay_signature === expectedSign) {
                console.log('Payment verified successfully');
                res.json({
                    success: true,
                    message: "Payment verified successfully"
                });
            } else {
                console.error('Invalid signature');
                res.status(400).json({
                    success: false,
                    message: "Invalid signature",
                    receivedSignature: razorpay_signature,
                    expectedSignature: expectedSign
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