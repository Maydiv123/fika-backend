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

module.exports = router; 