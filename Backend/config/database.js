const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-31725d0d-parking-management-system.k.aivencloud.com',
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT || 27117,
    ssl: {
        rejectUnauthorized: true 
    },
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
