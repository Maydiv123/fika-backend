const express = require('express');
const router = express.Router();

// Import controllers
const productController = require('../controllers/productController');

// Define routes
router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Category and sub-category routes
router.get('/category/:category', productController.getProductsByCategory);
router.get('/subcategory/:subCategory', productController.getProductsBySubCategory);

// Search route - Note: This must be before the /:id route to avoid conflicts
router.get('/search', productController.searchProducts);

module.exports = router; 