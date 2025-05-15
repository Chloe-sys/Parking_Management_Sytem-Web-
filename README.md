# 🚗 Parking Management System

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![License](https://img.shields.io/badge/License-MIT-yellow)

A modern full-stack parking management solution with separate interfaces for administrators and users, featuring secure authentication, real-time slot management, and comprehensive analytics.


## ✨ Key Features

### 👤 User Features
| Feature | Description |
|---------|-------------|
| **🔐 Secure Auth** | JWT authentication with email verification |
| **📊 User Dashboard** | View assigned slots, approval status, and notifications |
| **👤 Profile Control** | Update personal info and change password |

### 👨‍💼 Admin Features
| Feature | Description |
|---------|-------------|
| **👥 User Management** | Approve/reject users, view all registrations |
| **🚘 Slot Administration** | Create/update/delete slots, assign to users |
| **📈 Analytics Dashboard** | Real-time parking statistics and utilization rates |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express 4.x
- **Database**: MySQL 8.0
- **Auth**: JWT with bcrypt hashing
- **Email**: Nodemailer for OTP/notifications

### Frontend
- **Framework**: React 18 + Vite
- **UI Library**: Material-UI (MUI)
- **Styling**: TailwindCSS
- **State Management**: React Context API

## 🚀 Quick Start

### Prerequisites
- Node.js ≥18.x
- MySQL ≥8.0
- SMTP credentials

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/parking-management.git
cd parking-management

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials
```
## 🗃️ Database Setup

```sql
-- Create database and user
CREATE DATABASE parking_system;
CREATE USER 'parking_admin'@'localhost' IDENTIFIED BY 'securepassword';
GRANT ALL PRIVILEGES ON parking_system.* TO 'parking_admin'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE parking_system;

-- Import schema from database/schema.sql
```
## 🚀 Running the System

### Backend Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server (production)
npm start

# Or for development with hot-reload
npm run dev

# Server will be available at:
# http://localhost:8082
```

###Frontend Server
```bash
# Open new terminal window
# Navigate to frontend directory
cd ../Front

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will be available at:
# http://localhost:8086
```

# 📚 API Documentation

Explore our interactive API documentation powered by **Swagger UI**:

🔗 [http://localhost:8082/api-docs](http://localhost:8082/api-docs)

---

## 🔑 Key Endpoints

| **Endpoint**                      | **Method** | **Description**                        | **Required Role** | **Request Body Example**                                      |
|----------------------------------|------------|----------------------------------------|--------------------|----------------------------------------------------------------|
| `/api/auth/signup`               | POST       | Register new user                      | Public             | `{ "name": "John", "email": "john@example.com", "password": "pass123", "plateNumber": "RAA123" }` |
| `/api/auth/login`               | POST       | User authentication                    | Public             | `{ "email": "john@example.com", "password": "pass123" }`       |
| `/api/user/dashboard`            | GET        | Get user dashboard                     | User               | Requires JWT token in header                                  |
| `/api/admin/parking-slots`       | POST       | Create new parking slot                | Admin              | `{ "slotNumber": "A1"}`               |
| `/api/admin/slots/:id/assign`    | POST       | Assign slot to specific user           | Admin              | `{ "userId": "12345" }`                                        |

---

✅ Ensure to include the **JWT token** in the `Authorization` header for protected routes:


