const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: 'r3WxUOnCSmWAedhkRKHaXApE'
});

const paymentController = {
    // Get Razorpay Key
    getRazorpayKey: (req, res) => {
        res.json({
            key: 'rzp_test_2LKLmubQ5uu0M4'
        });
    },

    // Create Order
    createOrder: async (req, res) => {
        try {
            console.log('Received create order request:', req.body);
            const { amount, currency = "INR" } = req.body;
            
            if (!amount || isNaN(amount)) {
                console.error('Invalid amount received:', amount);
                return res.status(400).json({ error: 'Invalid amount' });
            }

            const options = {
                amount: amount, // Amount is already in paise from frontend
                currency,
                receipt: `order_${Date.now()}`,
            };

            console.log('Creating Razorpay order with options:', options);
            const order = await razorpay.orders.create(options);
            console.log('Order created successfully:', order);
            res.json(order);
        } catch (error) {
            console.error('Detailed error in createOrder:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            res.status(500).json({ 
                error: 'Error creating order',
                details: error.message 
            });
        }
    },

    // Verify Payment
    verifyPayment: (req, res) => {
        try {
            console.log('Received verify payment request:', req.body);
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", 'r3WxUOnCSmWAedhkRKHaXApE')
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