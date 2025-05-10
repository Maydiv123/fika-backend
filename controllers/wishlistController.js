const db = require('../config/db');

// Get all wishlist items with product details
const getWishlist = (req, res) => {
    const query = `
        SELECT w.*, p.product_name, p.image, p.mrp, p.inventory
        FROM wishlist w
        JOIN allproducts p ON w.product_id = p.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Add item to wishlist
const addToWishlist = (req, res) => {
    const { product_id } = req.body;
    
    // First check if product exists
    db.query(
        'SELECT id FROM allproducts WHERE id = ?',
        [product_id],
        (err, productResults) => {
            if (err) return res.status(500).json({ error: err.message });
            if (productResults.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Check if already in wishlist
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