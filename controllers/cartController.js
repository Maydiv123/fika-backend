const db = require('../config/db');

// Get all cart items with product details
const getCart = (req, res) => {
    const query = `
        SELECT c.*, p.product_name, p.image, p.mrp, p.inventory
        FROM cart c
        JOIN allproducts p ON c.product_id = p.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Add item to cart
const addToCart = (req, res) => {
    const { product_id, quantity } = req.body;
    
    // First check if product exists and has enough inventory
    db.query(
        'SELECT inventory FROM allproducts WHERE id = ?',
        [product_id],
        (err, productResults) => {
            if (err) return res.status(500).json({ error: err.message });
            if (productResults.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            const requestedQuantity = quantity || 1;
            if (productResults[0].inventory < requestedQuantity) {
                return res.status(400).json({ error: 'Not enough inventory available' });
            }

            // Check if product already in cart
            db.query(
                'SELECT * FROM cart WHERE product_id = ?',
                [product_id],
                (err, results) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (results.length > 0) {
                        // Update quantity
                        const newQuantity = results[0].quantity + requestedQuantity;
                        if (newQuantity > productResults[0].inventory) {
                            return res.status(400).json({ error: 'Not enough inventory available' });
                        }
                        
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
                            [product_id, requestedQuantity],
                            (err3, result) => {
                                if (err3) return res.status(500).json({ error: err3.message });
                                res.status(201).json({ id: result.insertId, product_id, quantity: requestedQuantity });
                            }
                        );
                    }
                }
            );
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
    const id = Number(req.params.id);
    const { quantity } = req.body;
    
    // First get the product_id from cart
    db.query(
        'SELECT product_id FROM cart WHERE id = ?',
        [id],
        (err, cartResults) => {
            if (err) return res.status(500).json({ error: err.message });
            if (cartResults.length === 0) {
                return res.status(404).json({ error: 'Cart item not found' });
            }

            // Check inventory
            db.query(
                'SELECT inventory FROM allproducts WHERE id = ?',
                [cartResults[0].product_id],
                (err, productResults) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (productResults.length === 0) {
                        return res.status(404).json({ error: 'Product not found' });
                    }

                    if (quantity > productResults[0].inventory) {
                        return res.status(400).json({ error: 'Not enough inventory available' });
                    }

                    // Update quantity
                    db.query(
                        'UPDATE cart SET quantity = ? WHERE id = ?',
                        [quantity, id],
                        (err, result) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({ message: 'Quantity updated' });
                        }
                    );
                }
            );
        }
    );
};

module.exports = { getCart, addToCart, removeFromCart, updateCartQuantity };