require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const parkingSlotRoutes = require('./routes/parkingSlot');
const userRoutes = require('./routes/user');
const swaggerSpecs = require('./config/swagger');

const app = express();

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:8086'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Parking Management System API',
            version: '1.0.0',
            description: 'API documentation for the Parking Management System',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
    },
    apis: ['./routes/*.js'], // path to the route files
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "ParkEase API Documentation"
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parking-slots', parkingSlotRoutes);
app.use('/api/user', userRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Parking Management System API.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        const connection = await pool.getConnection();
        console.log('Database connection established successfully.');
        connection.release();

        // Create necessary tables if they don't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                plateNumber VARCHAR(20),
                role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                isEmailVerified BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                isEmailVerified BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) NOT NULL,
                type ENUM('verification', 'reset') NOT NULL,
                role ENUM('user', 'admin') NOT NULL,
                isUsed BOOLEAN DEFAULT FALSE,
                expiresAt TIMESTAMP NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create parking_slots table
        const createParkingSlotsTable = `
            CREATE TABLE IF NOT EXISTS parking_slots (
                id INT PRIMARY KEY AUTO_INCREMENT,
                slotNumber VARCHAR(20) UNIQUE NOT NULL,
                status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
                userId INT,
                assignedAt TIMESTAMP NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )
        `;

        // Insert initial parking slots
        const insertParkingSlots = `
            INSERT INTO parking_slots (slotNumber, status) VALUES 
            ('A1', 'available'),
            ('A2', 'available'),
            ('A3', 'available'),
            ('B1', 'available'),
            ('B2', 'available'),
            ('B3', 'available'),
            ('C1', 'available'),
            ('C2', 'available'),
            ('C3', 'available')
            ON DUPLICATE KEY UPDATE status = 'available'
        `;

        await pool.query(createParkingSlotsTable);
        await pool.query(insertParkingSlots);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                isRead BOOLEAN DEFAULT FALSE,
                isSystem BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();
