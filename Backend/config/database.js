const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'chloe',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'parking_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection has been established successfully.');
        connection.release();
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
};

testConnection();

module.exports = pool; 