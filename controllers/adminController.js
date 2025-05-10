const db = require('../config/db');

// Products Management
const getAllProducts = async (req, res) => {
    try {
        const [products] = await db.promise.query(`
            SELECT p.*, 
                   COUNT(DISTINCT w.user_id) as wishlist_count,
                   GROUP_CONCAT(DISTINCT u.name) as wishlisted_by
            FROM products p
            LEFT JOIN wishlist w ON p.id = w.product_id
            LEFT JOIN users u ON w.user_id = u.id
            GROUP BY p.id
        `);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProduct = async (req, res) => {
    const { name, category, price, stock, status } = req.body;
    try {
        const [result] = await db.promise.query(
            'INSERT INTO products (name, category, price, stock, status) VALUES (?, ?, ?, ?, ?)',
            [name, category, price, stock, status]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category, price, stock, status } = req.body;
    try {
        await db.promise.query(
            'UPDATE products SET name = ?, category = ?, price = ?, stock = ?, status = ? WHERE id = ?',
            [name, category, price, stock, status, id]
        );
        res.json({ id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Users Management
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.promise.query(`
            SELECT 
                id,
                CONCAT(firstName, ' ', lastName) as name,
                email,
                role,
                CASE 
                    WHEN status IS NULL THEN 'active'
                    ELSE status 
                END as status,
                created_at
            FROM users
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    
    try {
        // Split the name into firstName and lastName
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');

        await db.promise.query(
            'UPDATE users SET firstName = ?, lastName = ?, email = ?, role = ?, status = ? WHERE id = ?',
            [firstName, lastName, email, role, status, id]
        );
        res.json({ id, name, email, role, status });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Orders Management
const getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.promise.query(`
            SELECT o.*, u.name as customer_name, u.email as customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.promise.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        res.json({ id, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Categories Management
const getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.promise.query('SELECT * FROM categories');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.promise.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        await db.promise.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        res.json({ id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Analytics
const getDashboardOverview = async (req, res) => {
    try {
        const [totalSales] = await db.promise.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as average_order_value
            FROM orders
            WHERE status = 'completed'
        `);

        const [userStats] = await db.promise.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users
            FROM users
        `);

        const [productStats] = await db.promise.query(`
            SELECT 
                COUNT(*) as total_products,
                SUM(stock) as total_stock
            FROM products
        `);

        res.json({
            sales: totalSales[0],
            users: userStats[0],
            products: productStats[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSalesAnalytics = async (req, res) => {
    try {
        const [salesData] = await db.promise.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                SUM(total_amount) as revenue
            FROM orders
            WHERE status = 'completed'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);
        res.json(salesData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        const [userData] = await db.promise.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);
        res.json(userData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllOrders,
    updateOrderStatus,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getDashboardOverview,
    getSalesAnalytics,
    getUserAnalytics
}; 