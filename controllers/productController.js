const db = require('../config/db');

const productController = {
    // Get all products
    getAllProducts: (req, res) => {
        const query = 'SELECT * FROM products';
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Error fetching products' });
            }
            res.json(results);
        });
    },

    // Get single product by ID
    getProductById: (req, res) => {
        // Get product details
        const productQuery = 'SELECT * FROM products WHERE id = ?';
        
        db.query(productQuery, [req.params.id], (err, productResults) => {
            if (err) {
                console.error('Error fetching product:', err);
                return res.status(500).json({ error: 'Error fetching product' });
            }
            if (productResults.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Get product reviews
            const reviewsQuery = `
                SELECT r.*, u.name as user_name 
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.product_id = ?
                ORDER BY r.created_at DESC
            `;

            db.query(reviewsQuery, [req.params.id], (reviewErr, reviewResults) => {
                if (reviewErr) {
                    console.error('Error fetching reviews:', reviewErr);
                    return res.status(500).json({ error: 'Error fetching reviews' });
                }

                const product = productResults[0];
                product.reviews = reviewResults;

                res.json(product);
            });
        });
    },

    // Create a new product
    createProduct: (req, res) => {
        const {
            name,
            category,
            price,
            image,
            isNew,
            discount,
            description,
            details,
            sizes,
            colors,
            material,
            care
        } = req.body;

        const query = `
            INSERT INTO products 
            (name, category, price, image, isNew, discount, description, details, 
            sizes, colors, material, care) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            name,
            category,
            price,
            image,
            isNew || false,
            discount || 0,
            description,
            details,
            JSON.stringify(sizes),
            JSON.stringify(colors),
            material,
            care
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error creating product:', err);
                return res.status(500).json({ error: 'Error creating product' });
            }
            res.status(201).json({
                message: 'Product created successfully',
                productId: result.insertId
            });
        });
    },

    // Update a product
    updateProduct: (req, res) => {
        const {
            name,
            category,
            price,
            image,
            isNew,
            discount,
            description,
            details,
            sizes,
            colors,
            material,
            care
        } = req.body;

        // First check if product exists
        db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
            if (err) {
                console.error('Error checking product:', err);
                return res.status(500).json({ error: 'Error updating product' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const currentProduct = results[0];
            
            const query = `
                UPDATE products 
                SET name = ?, 
                    category = ?, 
                    price = ?, 
                    image = ?,
                    isNew = ?,
                    discount = ?,
                    description = ?,
                    details = ?,
                    sizes = ?,
                    colors = ?,
                    material = ?,
                    care = ?
                WHERE id = ?
            `;

            const values = [
                name || currentProduct.name,
                category || currentProduct.category,
                price || currentProduct.price,
                image || currentProduct.image,
                isNew !== undefined ? isNew : currentProduct.isNew,
                discount !== undefined ? discount : currentProduct.discount,
                description || currentProduct.description,
                details || currentProduct.details,
                sizes ? JSON.stringify(sizes) : currentProduct.sizes,
                colors ? JSON.stringify(colors) : currentProduct.colors,
                material || currentProduct.material,
                care || currentProduct.care,
                req.params.id
            ];

            db.query(query, values, (updateErr) => {
                if (updateErr) {
                    console.error('Error updating product:', updateErr);
                    return res.status(500).json({ error: 'Error updating product' });
                }
                res.json({ message: 'Product updated successfully' });
            });
        });
    },

    // Delete a product
    deleteProduct: (req, res) => {
        const query = 'DELETE FROM products WHERE id = ?';
        
        db.query(query, [req.params.id], (err, result) => {
            if (err) {
                console.error('Error deleting product:', err);
                return res.status(500).json({ error: 'Error deleting product' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json({ message: 'Product deleted successfully' });
        });
    }
};

module.exports = productController; 