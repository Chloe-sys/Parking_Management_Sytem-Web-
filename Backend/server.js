require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const ticketRoutes = require('./routes/ticketRoutes');
const slotRequestRoutes = require('./routes/slotRequestRoutes');
const parkingSlotRoutes = require('./routes/parkingSlot');
// const swaggerSpecs = require('./config/swagger');

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
            contact: {
                name: 'Chloe Ishimwe',
                email: 'karlychloee12@gmail.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 8082}`,
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./routes/*.js']
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
app.use('/api/user', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/slot-requests', slotRequestRoutes);
app.use('/api/parking-slots', parkingSlotRoutes);

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

const PORT = process.env.PORT || 8082;

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
                preferredEntryTime TIMESTAMP NULL,
                preferredExitTime TIMESTAMP NULL,
                role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                rejectionReason TEXT,
                isEmailVerified TINYINT(1) DEFAULT 0,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'super_admin') DEFAULT 'admin',
                isEmailVerified TINYINT(1) DEFAULT 0,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_slots (
                id INT PRIMARY KEY AUTO_INCREMENT,
                slotNumber VARCHAR(20) NOT NULL UNIQUE,
                status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
                userId INT,
                assignedAt TIMESTAMP NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT,
                type ENUM('approval', 'rejection', 'slot_assigned', 'slot_released') NOT NULL,
                message TEXT NOT NULL,
                isRead TINYINT(1) DEFAULT 0,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) NOT NULL,
                type ENUM('verification', 'reset') NOT NULL,
                role ENUM('user', 'admin') NOT NULL,
                expiresAt DATETIME NOT NULL,
                isUsed TINYINT(1) DEFAULT 0,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS slot_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                slotId INT NOT NULL,
                requestedEntryTime DATETIME NOT NULL,
                requestedExitTime DATETIME NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (slotId) REFERENCES parking_slots(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                slotId INT NOT NULL,
                requestedEntryTime DATETIME NOT NULL,
                requestedExitTime DATETIME NOT NULL,
                actualEntryTime TIMESTAMP NULL,
                actualExitTime TIMESTAMP NULL,
                duration INT NULL,
                amount DECIMAL(10,2) NULL,
                status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (slotId) REFERENCES parking_slots(id) ON DELETE CASCADE
            )
        `);

        // Create indexes
        await createIndexIfNotExists('users', 'idx_users_email', 'email');
        await createIndexIfNotExists('users', 'idx_users_status', 'status');
        await createIndexIfNotExists('admins', 'idx_admins_email', 'email');
        await createIndexIfNotExists('parking_slots', 'idx_parking_slots_status', 'status');
        await createIndexIfNotExists('parking_slots', 'idx_parking_slots_userId', 'userId');
        await createIndexIfNotExists('notifications', 'idx_notifications_userId', 'userId');
        await createIndexIfNotExists('notifications', 'idx_notifications_isRead', 'isRead');
        await createIndexIfNotExists('slot_requests', 'idx_slot_requests_userId', 'userId');
        await createIndexIfNotExists('slot_requests', 'idx_slot_requests_slotId', 'slotId');
        await createIndexIfNotExists('slot_requests', 'idx_slot_requests_status', 'status');
        await createIndexIfNotExists('tickets', 'idx_tickets_userId', 'userId');
        await createIndexIfNotExists('tickets', 'idx_tickets_slotId', 'slotId');
        await createIndexIfNotExists('tickets', 'idx_tickets_status', 'status');

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
