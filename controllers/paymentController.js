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
            const { amount, currency = "INR" } = req.body;
            
            const options = {
                amount: amount, // Amount is already in paise from frontend
                currency,
                receipt: `order_${Date.now()}`,
            };

            const order = await razorpay.orders.create(options);
            res.json(order);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Error creating order' });
        }
    },

    // Verify Payment
    verifyPayment: (req, res) => {
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
    }
};

module.exports = paymentController; 