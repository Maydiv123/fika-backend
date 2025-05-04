const db = require('../config/db');

// Get all cart items
const getCart = (req, res) => {
    db.query('SELECT * FROM cart', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Add item to cart
const addToCart = (req, res) => {
    const { product_id, quantity } = req.body;
    // Check if product already in cart
    db.query(
        'SELECT * FROM cart WHERE product_id = ?',
        [product_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) {
                // Update quantity
                const newQuantity = results[0].quantity + (quantity || 1);
                db.query(
                    'UPDATE cart SET quantity = ? WHERE id = ?',
                    [newQuantity, results[0].id],
                    (err2) => {
                        if (err2) return res.status(500).json({ error: err2.message });
                        res.status(200).json({ id: results[0].id, product_id, quantity: newQuantity });
                    }
                );
            } else {
                // Insert new row
                db.query(
                    'INSERT INTO cart (product_id, quantity) VALUES (?, ?)',
                    [product_id, quantity || 1],
                    (err3, result) => {
                        if (err3) return res.status(500).json({ error: err3.message });
                        res.status(201).json({ id: result.insertId, product_id, quantity: quantity || 1 });
                    }
                );
            }
        }
    );
};

// Remove item from cart
const removeFromCart = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM cart WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item removed from cart' });
    });
};

// Update cart item quantity
const updateCartQuantity = (req, res) => {
    const id = Number(req.params.id); // Ensure id is a number
    const { quantity } = req.body;
    console.log('PATCH /api/cart/:id', { id, quantity });
    db.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [quantity, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Cart item not found' });
            }
            res.json({ message: 'Quantity updated' });
        }
    );
};

module.exports = { getCart, addToCart, removeFromCart, updateCartQuantity };

