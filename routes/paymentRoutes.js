const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateUser } = require('../middleware/auth');

// Payment routes
router.post('/create-order', authenticateUser, paymentController.createOrder);
router.post('/verify-payment', authenticateUser, paymentController.verifyPayment);
router.get('/get-key', paymentController.getRazorpayKey);
router.post('/payment-success', authenticateUser, paymentController.handlePaymentSuccess);

module.exports = router; 