const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');
const ParkingSlotController = require('../controllers/parkingSlotController');

// Protected admin routes
router.get('/profile', auth, isAdmin, AdminController.getProfile);
router.put('/profile-change', auth, isAdmin, AdminController.updateProfile);
router.put('/change-password', auth, isAdmin, AdminController.changePassword);
router.get('/dashboard', auth, isAdmin, AdminController.getDashboardStats);
router.get('/pending-users', auth, isAdmin, AdminController.getPendingUsers);
router.post('/users/:userId/approve', auth, isAdmin, AdminController.approveUser);
router.post('/users/:userId/reject', auth, isAdmin, AdminController.rejectUser);
router.get('/parking-stats', auth, isAdmin, AdminController.getParkingStats);

// User management routes
router.get('/users', auth, isAdmin, AdminController.getUsers);
router.get('/users/:id', auth, isAdmin, AdminController.getUserById);
router.get('/users-with-slots', auth, isAdmin, AdminController.getUsersWithSlots);

// Parking slot management routes
router.get('/parking-slots/all', auth, isAdmin, ParkingSlotController.getAllSlots);
router.post('/parking-slots', auth, isAdmin, ParkingSlotController.createSlot);
router.put('/parking-slots/:slotId', auth, isAdmin, ParkingSlotController.updateSlot);
router.delete('/parking-slots/:slotId', auth, isAdmin, ParkingSlotController.deleteSlot);
router.post('/parking-slots/:slotId/assign', auth, isAdmin, ParkingSlotController.assignSlotToUser);

module.exports = router; 

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [admin]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ParkingSlot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         number:
 *           type: string
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance]
 *         userId:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *         activeUsers:
 *           type: integer
 *         pendingUsers:
 *           type: integer
 *         totalSlots:
 *           type: integer
 *         availableSlots:
 *           type: integer
 *         occupiedSlots:
 *           type: integer
 *     ParkingStats:
 *       type: object
 *       properties:
 *         totalSlots:
 *           type: integer
 *         availableSlots:
 *           type: integer
 *         occupiedSlots:
 *           type: integer
 *         maintenanceSlots:
 *           type: integer
 *         utilizationPercentage:
 *           type: number
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ==================== PROTECTED ADMIN ROUTES ====================

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     summary: Get admin profile information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfile'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/profile-change:
 *   put:
 *     summary: Update admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfile'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/change-password:
 *   put:
 *     summary: Change admin password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Missing or invalid token or wrong current password
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/pending-users:
 *   get:
 *     summary: Get list of pending users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/users/{userId}/approve:
 *   post:
 *     summary: Approve a pending user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to approve
 *     responses:
 *       200:
 *         description: User approved successfully
 *       400:
 *         description: Bad request - User is not pending approval
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users/{userId}/reject:
 *   post:
 *     summary: Reject a pending user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to reject
 *     responses:
 *       200:
 *         description: User rejected successfully
 *       400:
 *         description: Bad request - User is not pending approval
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/parking-stats:
 *   get:
 *     summary: Get parking statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parking statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingStats'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users-with-slots:
 *   get:
 *     summary: Get users with their assigned parking slots
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     $ref: '#/components/schemas/User'
 *                   slot:
 *                     $ref: '#/components/schemas/ParkingSlot'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

// ==================== PARKING SLOT MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /admin/parking-slots/all:
 *   get:
 *     summary: Get all parking slots
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parking slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSlot'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/parking-slots:
 *   post:
 *     summary: Create a new parking slot
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - status
 *             properties:
 *               number:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, occupied, maintenance]
 *     responses:
 *       201:
 *         description: Parking slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 */

/**
 * @swagger
 * /admin/parking-slots/{slotId}:
 *   put:
 *     summary: Update a parking slot
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         schema:
 *           type: string
 *         required: true
 *         description: Parking slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, occupied, maintenance]
 *     responses:
 *       200:
 *         description: Parking slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Parking slot not found
 */

/**
 * @swagger
 * /admin/parking-slots/{slotId}:
 *   delete:
 *     summary: Delete a parking slot
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         schema:
 *           type: string
 *         required: true
 *         description: Parking slot ID
 *     responses:
 *       200:
 *         description: Parking slot deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Parking slot not found
 */

/**
 * @swagger
 * /admin/parking-slots/{slotId}/assign:
 *   post:
 *     summary: Assign parking slot to user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         schema:
 *           type: string
 *         required: true
 *         description: Parking slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Parking slot assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Bad request - Invalid input data or slot not available
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Parking slot or user not found
 */
