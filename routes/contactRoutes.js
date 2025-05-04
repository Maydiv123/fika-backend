const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/', contactController.addContactMessage);
router.get('/', contactController.getAllMessages); // Optional: for admin

module.exports = router; 