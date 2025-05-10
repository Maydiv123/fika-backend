const db = require('../config/db');

const productController = {
    // Get all products
    getAllProducts: (req, res) => {
        const query = 'SELECT * FROM allproducts';
        
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
        const productQuery = 'SELECT * FROM allproducts WHERE id = ?';
        
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
            image,
            category,
            sub_category,
            product_code,
            color,
            product_name,
            product_description,
            material,
            product_details,
            dimension,
            care_instructions,
            cost_price,
            inventory,
            mrp
        } = req.body;

        const query = `
            INSERT INTO allproducts 
            (image, category, sub_category, product_code, color, product_name, 
            product_description, material, product_details, dimension, 
            care_instructions, cost_price, inventory, mrp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            image,
            category,
            sub_category,
            product_code,
            color,
            product_name,
            product_description,
            material,
            product_details,
            dimension,
            care_instructions,
            cost_price,
            inventory,
            mrp
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
            image,
            category,
            sub_category,
            product_code,
            color,
            product_name,
            product_description,
            material,
            product_details,
            dimension,
            care_instructions,
            cost_price,
            inventory,
            mrp
        } = req.body;

        // First check if product exists
        db.query('SELECT * FROM allproducts WHERE id = ?', [req.params.id], (err, results) => {
            if (err) {
                console.error('Error checking product:', err);
                return res.status(500).json({ error: 'Error updating product' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const currentProduct = results[0];
            
            const query = `
                UPDATE allproducts 
                SET image = ?, 
                    category = ?, 
                    sub_category = ?, 
                    product_code = ?,
                    color = ?,
                    product_name = ?,
                    product_description = ?,
                    material = ?,
                    product_details = ?,
                    dimension = ?,
                    care_instructions = ?,
                    cost_price = ?,
                    inventory = ?,
                    mrp = ?
                WHERE id = ?
            `;

            const values = [
                image || currentProduct.image,
                category || currentProduct.category,
                sub_category || currentProduct.sub_category,
                product_code || currentProduct.product_code,
                color || currentProduct.color,
                product_name || currentProduct.product_name,
                product_description || currentProduct.product_description,
                material || currentProduct.material,
                product_details || currentProduct.product_details,
                dimension || currentProduct.dimension,
                care_instructions || currentProduct.care_instructions,
                cost_price || currentProduct.cost_price,
                inventory || currentProduct.inventory,
                mrp || currentProduct.mrp,
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
        const query = 'DELETE FROM allproducts WHERE id = ?';
        
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
    },

    // Get products by category
    getProductsByCategory: (req, res) => {
        const query = 'SELECT * FROM allproducts WHERE category = ?';
        
        db.query(query, [req.params.category], (err, results) => {
            if (err) {
                console.error('Error fetching products by category:', err);
                return res.status(500).json({ error: 'Error fetching products' });
            }
            res.json(results);
        });
    },

    // Get products by sub-category
    getProductsBySubCategory: (req, res) => {
        const query = 'SELECT * FROM allproducts WHERE sub_category = ?';
        
        db.query(query, [req.params.subCategory], (err, results) => {
            if (err) {
                console.error('Error fetching products by sub-category:', err);
                return res.status(500).json({ error: 'Error fetching products' });
            }
            res.json(results);
        });
    },

    // Search products
    searchProducts: (req, res) => {
        const searchTerm = `%${req.query.q}%`;
        const query = `
            SELECT * FROM allproducts 
            WHERE product_name LIKE ? 
            OR product_description LIKE ? 
            OR category LIKE ? 
            OR sub_category LIKE ?
        `;
        
        db.query(query, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
            if (err) {
                console.error('Error searching products:', err);
                return res.status(500).json({ error: 'Error searching products' });
            }
            res.json(results);
        });
    }
};

module.exports = productController; 