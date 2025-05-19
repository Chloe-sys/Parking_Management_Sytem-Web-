const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');
const { auth, isAdmin, isApproved } = require('../middleware/auth');
const Ticket = require('../models/Ticket');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */

// User routes - require authentication and approval
router.get('/my/active', auth, isApproved, TicketController.getUserActiveTicket);
router.get('/my/history', auth, isApproved, TicketController.getUserTickets);
router.get('/my/export', auth, isApproved, TicketController.exportUserTickets);
router.post('/request', auth, isApproved, TicketController.createTicket);
router.post('/calculate', auth, isApproved, TicketController.calculateEstimatedAmount);

// Admin routes - require authentication and admin role
router.get('/admin/active', auth, isAdmin, TicketController.getActiveTickets);
router.get('/admin/all', auth, isAdmin, TicketController.getAllTickets);
router.get('/admin/export', auth, isAdmin, TicketController.exportAllTickets);
router.post('/admin/activate', auth, isAdmin, TicketController.activateTicket);
router.post('/admin/complete', auth, isAdmin, TicketController.completeTicket);

// Calculate estimated amount for a parking session
router.post('/calculate-amount', auth, async (req, res) => {
  try {
    const { requestedEntryTime, requestedExitTime } = req.body;

    if (!requestedEntryTime || !requestedExitTime) {
      return res.status(400).json({
        success: false,
        message: 'Entry and exit times are required'
      });
    }

    const result = await Ticket.calculateEstimatedAmount(requestedEntryTime, requestedExitTime);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate estimated amount'
    });
  }
});

module.exports = router; 