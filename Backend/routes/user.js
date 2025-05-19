const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, isApproved } = require('../middleware/auth');
const ParkingSlotController = require('../controllers/parkingSlotController');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/user/dashboard:
 *   get:
 *     summary: Get user dashboard information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 assignedSlot:
 *                   $ref: '#/components/schemas/ParkingSlot'
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 */
router.get('/dashboard', auth, isApproved, userController.getDashboard);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 */
router.get('/profile', auth, isApproved, userController.getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
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
 *                 description: User's full name
 *               plateNumber:
 *                 type: string
 *                 description: User's vehicle plate number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 */
router.put('/profile', auth, isApproved, userController.updateProfile);

/**
 * @swagger
 * /api/user/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [User]
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
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized or invalid current password
 *       403:
 *         description: Forbidden - User role required
 */
router.put('/change-password', auth, isApproved, userController.changePassword);

/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 */
router.get('/notifications', auth, isApproved, userController.getNotifications);

/**
 * @swagger
 * /api/user/notifications/{notificationId}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 *       404:
 *         description: Notification not found
 */
router.post('/notifications/:notificationId/read', auth, isApproved, userController.markNotificationAsRead);

/**
 * @swagger
 * /api/user/slot:
 *   get:
 *     summary: Get user's assigned parking slot
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's assigned parking slot information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSlot'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 *       404:
 *         description: No slot assigned
 */
router.get('/slot', auth, isApproved, ParkingSlotController.getMySlot);

/**
 * @swagger
 * /api/user/slot-requests:
 *   post:
 *     summary: Request a parking slot
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for the parking slot
 *               time:
 *                 type: string
 *                 format: time
 *                 description: Time for the parking slot
 *     responses:
 *       200:
 *         description: Slot request created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 */
router.post('/slot-requests', auth, isApproved, userController.requestSlot);

/**
 * @swagger
 * /api/user/slot-requests:
 *   get:
 *     summary: Get user's parking slot requests
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's parking slot requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSlotRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role required
 */
router.get('/slot-requests', auth, isApproved, userController.getSlotRequests);

module.exports = router; 