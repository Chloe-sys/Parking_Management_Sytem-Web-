-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    plateNumber VARCHAR(20),
    preferredEntryTime TIMESTAMP NULL,
    preferredExitTime TIMESTAMP NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejectionReason TEXT,
    isEmailVerified TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'super_admin') DEFAULT 'admin',
    isEmailVerified TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parking slots table
CREATE TABLE parking_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slotNumber VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
    userId INT,
    assignedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT,
    type ENUM('approval', 'rejection', 'slot_assigned', 'slot_released') NOT NULL,
    message TEXT NOT NULL,
    isRead TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- OTP table
CREATE TABLE otps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type ENUM('verification', 'reset') NOT NULL,
    role ENUM('user', 'admin') NOT NULL,
    expiresAt DATETIME NOT NULL,
    isUsed TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Slot Requests table
CREATE TABLE slot_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    slotId INT NOT NULL,
    requestedEntryTime TIMESTAMP NOT NULL,
    requestedExitTime TIMESTAMP NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slotId) REFERENCES parking_slots(id) ON DELETE CASCADE
);

-- Tickets table
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    slotId INT NOT NULL,
    requestedEntryTime TIMESTAMP NOT NULL,
    requestedExitTime TIMESTAMP NOT NULL,
    actualEntryTime TIMESTAMP NULL,
    actualExitTime TIMESTAMP NULL,
    duration INT NULL, -- Duration in minutes
    amount DECIMAL(10,2) NULL, -- Amount in RWF
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slotId) REFERENCES parking_slots(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_parking_slots_status ON parking_slots(status);
CREATE INDEX idx_parking_slots_userId ON parking_slots(userId);
CREATE INDEX idx_notifications_userId ON notifications(userId);
CREATE INDEX idx_notifications_isRead ON notifications(isRead);

-- Create indexes for slot requests
CREATE INDEX idx_slot_requests_userId ON slot_requests(userId);
CREATE INDEX idx_slot_requests_slotId ON slot_requests(slotId);
CREATE INDEX idx_slot_requests_status ON slot_requests(status);
CREATE INDEX idx_slot_requests_entryTime ON slot_requests(requestedEntryTime);
CREATE INDEX idx_slot_requests_exitTime ON slot_requests(requestedExitTime);

-- Create indexes for tickets
CREATE INDEX idx_tickets_userId ON tickets(userId);
CREATE INDEX idx_tickets_slotId ON tickets(slotId);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_requestedEntryTime ON tickets(requestedEntryTime);
CREATE INDEX idx_tickets_requestedExitTime ON tickets(requestedExitTime);
CREATE INDEX idx_tickets_actualEntryTime ON tickets(actualEntryTime);
CREATE INDEX idx_tickets_actualExitTime ON tickets(actualExitTime); 