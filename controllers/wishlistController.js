const db = require('../config/db');

// Get all wishlist items
const getWishlist = (req, res) => {
    db.query('SELECT * FROM wishlist', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Add item to wishlist
const addToWishlist = (req, res) => {
    const { product_id } = req.body;
    db.query(
        'SELECT * FROM wishlist WHERE product_id = ?',
        [product_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) {
                return res.status(200).json({ message: 'Already in wishlist' });
            }
            db.query(
                'INSERT INTO wishlist (product_id) VALUES (?)',
                [product_id],
                (err2, result) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.status(201).json({ id: result.insertId, product_id });
                }
            );
        }
    );
};

// Remove item from wishlist
const removeFromWishlist = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM wishlist WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item removed from wishlist' });
    });
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist }; 