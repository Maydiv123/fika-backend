const db = require('../config/db');
const bcrypt = require('bcryptjs');
const otpStore = require('../utils/otpStore');

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const query = 'SELECT id, firstName, lastName, email, gender, dateOfBirth, contactNumber, created_at FROM users';
        const [results] = await db.promise.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
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
        const [existingUsers] = await db.promise.query(checkUser, [email]);
        
        if (existingUsers.length > 0) {
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

        const [result] = await db.promise.query(
            query,
            [firstName, lastName, email, hashedPassword, gender, formattedDob, contactNumber]
        );

        res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT id, firstName, lastName, email, gender, dateOfBirth, contactNumber FROM users WHERE id = ?';
        
        const [results] = await db.promise.query(query, [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
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
        
        const [result] = await db.promise.query(query, [firstName, lastName, gender, formattedDob, contactNumber, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM users WHERE id = ?';
        
        const [result] = await db.promise.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Login with email or phone and password
const loginUser = async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;
        if (!emailOrPhone || !password) {
            // Log failed attempt
            await db.promise.query(
                'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
                [emailOrPhone, 'failed', password]
            );
            return res.status(400).json({ error: 'Email/Phone and password are required' });
        }
        
        const query = 'SELECT * FROM users WHERE email = ? OR contactNumber = ?';
        const [results] = await db.promise.query(query, [emailOrPhone, emailOrPhone]);
        
        if (results.length === 0) {
            await db.promise.query(
                'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
                [emailOrPhone, 'failed', password]
            );
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }
        
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            await db.promise.query(
                'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
                [emailOrPhone, 'failed', password]
            );
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }
        
        // Success: log successful login
        await db.promise.query(
            'INSERT INTO login_logs (emailOrPhone, status, password_attempt) VALUES (?, ?, ?)',
            [emailOrPhone, 'success', password]
        );
        
        // Success: return user info (without password)
        const { password: _, ...userData } = user;
        res.json({ message: 'Login successful', user: userData });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update password with OTP verification
const updatePassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
        }
        
        // Check OTP
        const otpVerification = otpStore.verifyOTP(email, otp);
        if (!otpVerification.valid) {
            return res.status(400).json({ success: false, message: otpVerification.message });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password in DB
        const query = 'UPDATE users SET password = ? WHERE email = ?';
        const [result] = await db.promise.query(query, [hashedPassword, email]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        
        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ success: false, message: 'Failed to update password.' });
    }
};

const verifyOtp = (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    
    const verification = otpStore.verifyOTP(email, otp);
    res.json({ 
        success: verification.valid, 
        message: verification.message 
    });
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
    updatePassword,
    verifyOtp
}; 