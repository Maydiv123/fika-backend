const express = require('express');
const router = express.Router();

// Import controllers
const userController = require('../controllers/userController');

// Define routes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/login', userController.loginUser);
router.post('/update-password', userController.updatePassword);
router.post('/verify-otp', userController.verifyOtp);

module.exports = router; 