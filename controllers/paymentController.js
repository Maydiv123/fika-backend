const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_test_2LKLmubQ5uu0M4',
  key_secret: 'r3WxUOnCSmWAedhkRKHaXApE'
});

const paymentController = {
    // Get Razorpay Key
    getRazorpayKey: (req, res) => {
        res.json({
            key: process.env.RAZORPAY_KEY_ID
        });
    },

    // Create Order
    createOrder: async (req, res) => {
        try {
            const { amount, currency = "INR" } = req.body;
            
            const options = {
                amount: amount * 100, // Razorpay expects amount in paise
                currency,
                receipt: `order_${Date.now()}`,
            };

            const order = await razorpay.orders.create(options);

            // Store order in database
            const query = `
                INSERT INTO orders (
                    order_id,
                    user_id,
                    amount,
                    currency,
                    status
                ) VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                query,
                [order.id, req.user.id, amount, currency, 'created'],
                (err) => {
                    if (err) {
                        console.error('Error storing order:', err);
                        return res.status(500).json({ error: 'Error creating order' });
                    }
                    res.json(order);
                }
            );
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
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Update order status in database
            const query = `
                UPDATE orders 
                SET 
                    status = ?,
                    payment_id = ?,
                    updated_at = NOW()
                WHERE order_id = ?
            `;

            db.query(
                query,
                ['completed', razorpay_payment_id, razorpay_order_id],
                (err) => {
                    if (err) {
                        console.error('Error updating order:', err);
                        return res.status(500).json({ error: 'Error verifying payment' });
                    }
                    res.json({
                        success: true,
                        message: "Payment verified successfully"
                    });
                }
            );
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
        }
    },

    // Handle Payment Success
    handlePaymentSuccess: async (req, res) => {
        try {
            const { 
                order_id,
                payment_id,
                cart_items
            } = req.body;

            // Start a transaction
            db.beginTransaction(async (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Transaction error' });
                }

                try {
                    // 1. Update order status
                    await db.query(
                        'UPDATE orders SET status = ? WHERE order_id = ?',
                        ['completed', order_id]
                    );

                    // 2. Create order items
                    for (const item of cart_items) {
                        await db.query(
                            `INSERT INTO order_items (
                                order_id,
                                product_id,
                                quantity,
                                price,
                                color,
                                size
                            ) VALUES (?, ?, ?, ?, ?, ?)`,
                            [order_id, item.id, item.quantity, item.price, item.selectedColor, item.selectedSize]
                        );

                        // 3. Update product stock (if you have stock management)
                        await db.query(
                            'UPDATE products SET stock = stock - ? WHERE id = ?',
                            [item.quantity, item.id]
                        );
                    }

                    // 4. Clear user's cart
                    await db.query(
                        'DELETE FROM cart WHERE user_id = ?',
                        [req.user.id]
                    );

                    // Commit transaction
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error completing order' });
                            });
                        }
                        res.json({
                            success: true,
                            message: 'Order completed successfully'
                        });
                    });
                } catch (error) {
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error processing order' });
                    });
                }
            });
        } catch (error) {
            console.error('Error handling payment success:', error);
            res.status(500).json({ error: 'Error handling payment success' });
        }
    }
};

module.exports = paymentController; 