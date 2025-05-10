const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Products management
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Users management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Orders management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', adminController.updateOrderStatus);

// Categories management
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Analytics
router.get('/analytics/overview', adminController.getDashboardOverview);
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);

module.exports = router; 