Parking Management System
Overview
This Parking Management System is a full-stack application designed to manage parking slots, user registrations, and administrative functions for a parking facility. The system features separate interfaces for administrators and regular users, with secure authentication and role-based access control.

Features
User Features
User Registration & Authentication

Sign up with email, name, and license plate number

Email verification via OTP

Secure login with JWT tokens

User Dashboard

View assigned parking slot

Check approval status

View notifications

Slot Management

Release occupied slot

View slot details

Profile Management

Update personal information

Change password

Admin Features
User Management

View all registered users

Approve/reject user applications

View user details (name, plate number, status)

Parking Slot Management

Create/update/delete parking slots

View all slots (available/occupied/reserved)

Assign slots to users

Dashboard & Analytics

View parking statistics (utilization rate, available slots)

See recent slot assignments

View pending approvals

Technical Stack

Backend
Runtime: Node.js

Framework: Express.js

Database: MySQL

Authentication: JWT (JSON Web Tokens)

Email Service: Nodemailer (for OTP and notifications)

Other Libraries:

bcryptjs (password hashing)

mysql2/promise (database client)

jsonwebtoken (JWT implementation)

Frontend 
Framework: React.js + Vite

UI Library: Material-UI 

Styling: TailwindCSS

Installation
Prerequisites
Node.js (v14 or higher)

MySQL database

SMTP credentials for email service

Backend Setup
Clone the repository:

bash
git clone [repository-url]
cd Backend
Install dependencies:

bash
npm install
Set up environment variables:
Create a .env file in the root directory with the following variables:

DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
Database setup:

Import the SQL schema from database/schema.sql


Start the server:

bash
npm start
# or for development
npm run dev
API Documentation
The API follows RESTful conventions with JSON responses. All endpoints (except authentication) require JWT authentication.

Base URL
http://localhost:8082/api

Authentication
POST /auth/signup - User registration

POST /auth/login - User login

POST /auth/verify-email - OTP verification

User Endpoints
GET /user/dashboard - Get user dashboard data

GET /user/slot - Get user's assigned slot

GET /user/notifications - Get user notifications

Admin Endpoints
GET /admin/users - Get all users

POST /admin/users/:userId/approve - Approve user

POST /admin/users/:userId/reject - Reject user

GET /admin/parking-slots - Get all parking slots

POST /admin/parking-slots - Create new slot

POST /admin/parking-slots/:slotId/assign - Assign slot to user

For more endpoints, reead documentation at http://localhost:8082/api-docs

Database Schema
Tables
users

id, name, email, password, plateNumber, status, role, isEmailVerified, createdAt, updatedAt

parking_slots

id, slotNumber, status, location, userId, assignedAt

notifications

id, userId, type, message, isRead, createdAt
