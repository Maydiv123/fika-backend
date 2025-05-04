const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateUser = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists in database
        db.query(
            'SELECT id, email, name FROM users WHERE id = ?',
            [decoded.userId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error authenticating user' });
                }
                
                if (results.length === 0) {
                    return res.status(401).json({ error: 'User not found' });
                }

                // Add user info to request
                req.user = results[0];
                next();
            }
        );
    } catch (error) {
        res.status(401).json({ error: 'Token is invalid' });
    }
};

module.exports = { authenticateUser }; 