const db = require('../config/db');

// Add a new blog newsletter subscriber
const addBlogSubscriber = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  db.query(
    'INSERT IGNORE INTO blog_newsletter_subscribers (email) VALUES (?)',
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(200).json({ message: "Already subscribed" });
      }
      res.status(201).json({ id: result.insertId, email });
    }
  );
};

// (Optional) Get all blog newsletter subscribers
const getAllBlogSubscribers = (req, res) => {
  db.query('SELECT * FROM blog_newsletter_subscribers ORDER BY subscribed_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

module.exports = { addBlogSubscriber, getAllBlogSubscribers }; 