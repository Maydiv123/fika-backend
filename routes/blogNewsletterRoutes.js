const express = require('express');
const router = express.Router();
const blogNewsletterController = require('../controllers/blogNewsletterController');

router.post('/', blogNewsletterController.addBlogSubscriber);
router.get('/', blogNewsletterController.getAllBlogSubscribers); // Optional: for admin

module.exports = router; 