const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get a promise-based interface for the pool
const promisePool = pool.promise();

// Handle connection errors
pool.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.');
    }
});

// Export both the callback and promise pool interfaces
module.exports = {
    // For callback-style code (legacy)
    query: (sql, values, callback) => {
        return pool.query(sql, values, callback);
    },
    execute: (sql, values, callback) => {
        return pool.execute(sql, values, callback);
    },
    connect: (callback) => {
        return pool.getConnection(callback);
    },
    // For promise-style code (modern)
    promise: promisePool
}; 