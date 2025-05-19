const express = require('express');
const router = express.Router();
const ParkingSlotController = require('../controllers/parkingSlotController');
const { auth, isAdmin, isApproved } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Parking Slots
 *   description: Parking slot management endpoints
 */

/**
 * @swagger
 * /api/parking-slots/available:
 *   get:
 *     summary: Get all available parking slots
 *     tags: [Parking Slots]
 *     responses:
 *       200:
 *         description: List of available parking slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSlot'
 */
router.get('/available', ParkingSlotController.getAvailableSlots);

/**
 * @swagger
 * /api/parking-slots/occupied:
 *   get:
 *     summary: Get all occupied parking slots
 *     tags: [Parking Slots]
 *     responses:
 *       200:
 *         description: List of occupied parking slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSlot'
 */
router.get('/occupied', ParkingSlotController.getOccupiedSlots);

/**
 * @swagger
 * /api/parking-slots/my-slot:
 *   get:
 *     summary: Get user's assigned parking slot
 *     tags: [Parking Slots]
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
 *         description: Forbidden - User not approved
 *       404:
 *         description: No slot assigned
 */
router.get('/my-slot', isApproved, ParkingSlotController.getMySlot);


/**
 * @swagger
 * /api/parking-slots:
 *   get:
 *     summary: Get all parking slots (Admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all parking slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSlot'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', isAdmin, isApproved, ParkingSlotController.getAllSlots);

/**
 * @swagger
 * /api/parking-slots/stats:
 *   get:
 *     summary: Get parking slot statistics (Admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parking slot statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of parking slots
 *                 available:
 *                   type: integer
 *                   description: Number of available slots
 *                 occupied:
 *                   type: integer
 *                   description: Number of occupied slots
 *                 reserved:
 *                   type: integer
 *                   description: Number of reserved slots
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats', isAdmin, ParkingSlotController.getSlotStats);

/**
 * @swagger
 * /api/parking-slots:
 *   post:
 *     summary: Create a new parking slot (Admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotNumber
 *             properties:
 *               slotNumber:
 *                 type: string
 *                 description: Unique identifier for the parking slot
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved]
 *                 default: available
 *                 description: Initial status of the parking slot
 *     responses:
 *       201:
 *         description: Parking slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       409:
 *         description: Slot number already exists
 */
router.post('/', isAdmin, ParkingSlotController.createSlot);

/**
 * @swagger
 * /api/parking-slots/{slotId}:
 *   put:
 *     summary: Update a parking slot (Admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the parking slot to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotNumber:
 *                 type: string
 *                 description: New slot number
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved]
 *                 description: New status of the parking slot
 *               userId:
 *                 type: integer
 *                 description: ID of the user to assign the slot to
 *     responses:
 *       200:
 *         description: Parking slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Parking slot not found
 */
router.put('/:slotId', isAdmin, ParkingSlotController.updateSlot);

/**
 * @swagger
 * /api/parking-slots/{slotId}:
 *   delete:
 *     summary: Delete a parking slot (Admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the parking slot to delete
 *     responses:
 *       200:
 *         description: Parking slot deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Parking slot not found
 */
router.delete('/:slotId', isAdmin, ParkingSlotController.deleteSlot);

module.exports = router; 