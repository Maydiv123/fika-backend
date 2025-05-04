const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users
const getAllUsers = (req, res) => {
    const query = 'SELECT id, firstName, lastName, email, gender, dateOfBirth, contactNumber, created_at FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
};

// Create a new user (signup)
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, gender, dateOfBirth, contactNumber } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        // Check if user already exists
        const checkUser = 'SELECT id FROM users WHERE email = ?';
        db.query(checkUser, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length > 0) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Format dateOfBirth to YYYY-MM-DD (robust)
            let formattedDob = null;
            if (dateOfBirth) {
                const dobObj = new Date(dateOfBirth);
                if (!isNaN(dobObj.getTime())) {
                    formattedDob = dobObj.toISOString().slice(0, 10);
                } else {
                    formattedDob = null;
                }
            }
            console.log("DOB received:", dateOfBirth, "Formatted:", formattedDob);

            // Insert new user
            const query = `
                INSERT INTO users (firstName, lastName, email, password, gender, dateOfBirth, contactNumber)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                query,
                [firstName, lastName, email, hashedPassword, gender, formattedDob, contactNumber],
                (err, result) => {
                    if (err) {
                        console.error('Error creating user:', err);
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    res.status(201).json({
                        message: 'User created successfully',
                        userId: result.insertId
                    });
                }
            );
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user by ID
const getUserById = (req, res) => {
    const { id } = req.params;
    const query = 'SELECT id, firstName, lastName, email, gender, dateOfBirth, contactNumber FROM users WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        res.json(results[0]);
    });
};

// Update user
const updateUser = (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, gender, dateOfBirth, contactNumber } = req.body;
    
    // Format dateOfBirth to YYYY-MM-DD
    let formattedDob = null;
    if (dateOfBirth) {
        const dobObj = new Date(dateOfBirth);
        if (!isNaN(dobObj)) {
            formattedDob = dobObj.toISOString().slice(0, 10);
        }
    }

    const query = `
        UPDATE users 
        SET firstName = ?, lastName = ?, gender = ?, dateOfBirth = ?, contactNumber = ?
        WHERE id = ?
    `;
    
    db.query(query, [firstName, lastName, gender, formattedDob, contactNumber, id], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        res.json({ message: 'User updated successfully' });
    });
};

// Delete user
const deleteUser = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM users WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        res.json({ message: 'User deleted successfully' });
    });
};

// Login with email or phone and password
const loginUser = (req, res) => {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
        // Log failed attempt
        db.query(
            'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
            [emailOrPhone, 'failed', password]
        );
        return res.status(400).json({ error: 'Email/Phone and password are required' });
    }
    const query = 'SELECT * FROM users WHERE email = ? OR contactNumber = ?';
    db.query(query, [emailOrPhone, emailOrPhone], async (err, results) => {
        if (err) {
            db.query(
                'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
                [emailOrPhone, 'failed', password]
            );
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length === 0) {
            db.query(
                'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
                [emailOrPhone, 'failed', password]
            );
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            db.query(
                'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
                [emailOrPhone, 'failed', password]
            );
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }
        // Success: log successful login
        db.query(
            'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
            [emailOrPhone, 'success', password]
        );
        // Success: return user info (without password)
        const { password: _, ...userData } = user;
        res.json({ message: 'Login successful', user: userData });
    });
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    loginUser
}; 