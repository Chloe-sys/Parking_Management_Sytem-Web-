const express = require('express');
const router = express.Router();
const SlotRequestController = require('../controllers/SlotRequestController');
const { auth, isAdmin, isApproved } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Slot Requests
 *   description: Parking slot request management endpoints
 */

// User routes - require authentication and approval
router.post('/', auth, isApproved, SlotRequestController.createRequest);
router.get('/user', auth, isApproved, SlotRequestController.getUserRequests);

// Admin routes - require authentication and admin role
router.get('/admin/pending', auth, isAdmin, SlotRequestController.getPendingRequests);
router.get('/admin/all', auth, isAdmin, SlotRequestController.getAllRequests);
router.post('/admin/approve', auth, isAdmin, SlotRequestController.approveRequest);
router.post('/admin/reject', auth, isAdmin, SlotRequestController.rejectRequest);

module.exports = router; 