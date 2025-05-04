const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.post('/', newsletterController.addSubscriber);
router.get('/', newsletterController.getAllSubscribers); // Optional: for admin

module.exports = router; 