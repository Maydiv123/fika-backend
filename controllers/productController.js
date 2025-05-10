const db = require('../config/db');

const productController = {
    // Get all products
    getAllProducts: async (req, res) => {
        try {
            const query = 'SELECT * FROM allproducts';
            const [results] = await db.promise.query(query);
            res.json(results);
        } catch (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ error: 'Error fetching products' });
        }
    },

    // Get single product by ID
    getProductById: async (req, res) => {
        try {
            const productQuery = 'SELECT * FROM allproducts WHERE id = ?';
            const [productResults] = await db.promise.query(productQuery, [req.params.id]);
            
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

            const [reviewResults] = await db.promise.query(reviewsQuery, [req.params.id]);

            const product = productResults[0];
            product.reviews = reviewResults;

            res.json(product);
        } catch (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ error: 'Error fetching product details' });
        }
    },

    // Create a new product
    createProduct: async (req, res) => {
        try {
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

            const [result] = await db.promise.query(query, values);
            
            res.status(201).json({
                message: 'Product created successfully',
                productId: result.insertId
            });
        } catch (err) {
            console.error('Error creating product:', err);
            res.status(500).json({ error: 'Error creating product' });
        }
    },

    // Update a product
    updateProduct: async (req, res) => {
        try {
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
            const [existingProducts] = await db.promise.query(
                'SELECT * FROM allproducts WHERE id = ?', 
                [req.params.id]
            );
            
            if (existingProducts.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const currentProduct = existingProducts[0];
            
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

            await db.promise.query(query, values);
            res.json({ message: 'Product updated successfully' });
        } catch (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ error: 'Error updating product' });
        }
    },

    // Delete a product
    deleteProduct: async (req, res) => {
        try {
            const query = 'DELETE FROM allproducts WHERE id = ?';
            
            const [result] = await db.promise.query(query, [req.params.id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json({ message: 'Product deleted successfully' });
        } catch (err) {
            console.error('Error deleting product:', err);
            res.status(500).json({ error: 'Error deleting product' });
        }
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