const pool = require('../config/database');
const Ticket = require('../models/Ticket');
const { errorResponse, successResponse } = require('../utils/helper');
const { validateTicket } = require('../utils/validators');
const { Parser } = require('json2csv');

const TicketController = {
    // Create a new ticket when a user is assigned a slot
    createTicket: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { userId, slotId } = req.body;

            await connection.beginTransaction();

            // Check if user already has an active ticket
            const activeTicket = await Ticket.getActiveTicketByUser(userId);
            if (activeTicket) {
                return errorResponse(res, 'User already has an active ticket', 400);
            }

            // Create new ticket
            const ticketId = await Ticket.create({
                userId,
                slotId,
                entryTime: new Date()
            });

            await connection.commit();

            return successResponse(res, 'Ticket created successfully', { ticketId });
        } catch (error) {
            await connection.rollback();
            console.error('Create ticket error:', error);
            return errorResponse(res, 'Error creating ticket', 500, error);
        } finally {
            connection.release();
        }
    },

    // Get user's active ticket
    getUserActiveTicket: async (req, res) => {
        try {
            const userId = req.user.id;
            const ticket = await Ticket.getActiveTicketByUser(userId);
            
            if (!ticket) {
                return successResponse(res, 'No active ticket found', { ticket: null });
            }

            // Get additional ticket information
            const [ticketDetails] = await pool.query(
                `SELECT 
                    t.*,
                    u.name as userName,
                    u.plateNumber,
                    ps.slotNumber
                FROM tickets t
                JOIN users u ON t.userId = u.id
                JOIN parking_slots ps ON t.slotId = ps.id
                WHERE t.id = ?`,
                [ticket.id]
            );

            return successResponse(res, 'Active ticket retrieved successfully', {
                ticket: ticketDetails[0]
            });
        } catch (error) {
            console.error('Error fetching user active ticket:', error);
            return errorResponse(res, 'Failed to fetch active ticket', 500, error);
        }
    },

    // Get user's ticket history
    getUserTickets: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            // Get total count
            const [countResult] = await pool.query(
                'SELECT COUNT(*) as total FROM tickets WHERE userId = ?',
                [userId]
            );
            const total = countResult[0].total;

            // Get paginated tickets with additional information
            const [tickets] = await pool.query(
                `SELECT 
                    t.*,
                    u.name as userName,
                    u.plateNumber,
                    ps.slotNumber
                FROM tickets t
                JOIN users u ON t.userId = u.id
                JOIN parking_slots ps ON t.slotId = ps.id
                WHERE t.userId = ?
                ORDER BY t.createdAt DESC
                LIMIT ? OFFSET ?`,
                [userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
            );

            return successResponse(res, 'Ticket history retrieved successfully', {
                tickets,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            });
        } catch (error) {
            console.error('Error fetching user tickets:', error);
            return errorResponse(res, 'Failed to fetch tickets', 500, error);
        }
    },

    // Admin: Get all active tickets
    getActiveTickets: async (req, res) => {
        try {
            const tickets = await Ticket.getActiveTickets();
            res.json(tickets);
        } catch (error) {
            console.error('Error fetching active tickets:', error);
            res.status(500).json({ error: 'Failed to fetch active tickets' });
        }
    },

    // Admin: Get all tickets with pagination and filtering
    getAllTickets: async (req, res) => {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const tickets = await Ticket.getAllTickets({
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });

            res.json(tickets);
        } catch (error) {
            console.error('Error fetching all tickets:', error);
            res.status(500).json({ error: 'Failed to fetch tickets' });
        }
    },

    // Admin: Activate a ticket
    activateTicket: async (req, res) => {
        try {
            const { ticketId } = req.body;

            // Validate input
            const validationError = validateTicket({ ticketId });
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            // Activate the ticket
            const result = await Ticket.activateTicket(ticketId);

            res.json({
                message: 'Ticket activated successfully',
                ...result
            });
        } catch (error) {
            console.error('Error activating ticket:', error);
            if (error.message.includes('not found') || error.message.includes('already activated')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to activate ticket' });
        }
    },

    // Admin: Complete a ticket
    completeTicket: async (req, res) => {
        try {
            const { ticketId } = req.body;

            // Validate input
            const validationError = validateTicket({ ticketId });
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            // Complete the ticket
            const result = await Ticket.completeTicket(ticketId);

            res.json({
                message: 'Ticket completed successfully',
                ...result
            });
        } catch (error) {
            console.error('Error completing ticket:', error);
            if (error.message.includes('not found') || error.message.includes('already completed')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to complete ticket' });
        }
    },

    // Calculate estimated amount for a ticket
    calculateEstimatedAmount: async (req, res) => {
        try {
            const { requestedEntryTime, requestedExitTime } = req.body;

            // Validate input
            if (!requestedEntryTime || !requestedExitTime) {
                return res.status(400).json({ 
                    error: 'Entry and exit times are required' 
                });
            }

            const result = await Ticket.calculateEstimatedAmount(
                requestedEntryTime,
                requestedExitTime
            );

            res.json(result);
        } catch (error) {
            console.error('Error calculating estimated amount:', error);
            res.status(500).json({ error: 'Failed to calculate estimated amount' });
        }
    },

    // Export user's ticket history
    exportUserTickets: async (req, res) => {
        try {
            const userId = req.user.id;

            // Get all tickets for the user
            const [tickets] = await pool.query(
                `SELECT 
                    t.*,
                    u.name as userName,
                    u.plateNumber,
                    ps.slotNumber,
                    DATE_FORMAT(t.requestedEntryTime, '%Y-%m-%d %H:%i:%s') as requestedEntryTime,
                    DATE_FORMAT(t.requestedExitTime, '%Y-%m-%d %H:%i:%s') as requestedExitTime,
                    DATE_FORMAT(t.actualEntryTime, '%Y-%m-%d %H:%i:%s') as actualEntryTime,
                    DATE_FORMAT(t.actualExitTime, '%Y-%m-%d %H:%i:%s') as actualExitTime,
                    DATE_FORMAT(t.createdAt, '%Y-%m-%d %H:%i:%s') as createdAt
                FROM tickets t
                JOIN users u ON t.userId = u.id
                JOIN parking_slots ps ON t.slotId = ps.id
                WHERE t.userId = ?
                ORDER BY t.createdAt DESC`,
                [userId]
            );

            // Define CSV fields
            const fields = [
                'id',
                'slotNumber',
                'plateNumber',
                'status',
                'requestedEntryTime',
                'requestedExitTime',
                'actualEntryTime',
                'actualExitTime',
                'duration',
                'amount',
                'createdAt'
            ];

            // Create CSV parser
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(tickets);

            // Set headers for CSV download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=ticket-history-${userId}-${new Date().toISOString().split('T')[0]}.csv`);

            return res.send(csv);
        } catch (error) {
            console.error('Error exporting user tickets:', error);
            return errorResponse(res, 'Failed to export tickets', 500, error);
        }
    },

    // Admin: Export all tickets
    exportAllTickets: async (req, res) => {
        try {
            const { status, startDate, endDate } = req.query;
            let query = `
                SELECT 
                    t.*,
                    u.name as userName,
                    u.plateNumber,
                    ps.slotNumber,
                    DATE_FORMAT(t.requestedEntryTime, '%Y-%m-%d %H:%i:%s') as requestedEntryTime,
                    DATE_FORMAT(t.requestedExitTime, '%Y-%m-%d %H:%i:%s') as requestedExitTime,
                    DATE_FORMAT(t.actualEntryTime, '%Y-%m-%d %H:%i:%s') as actualEntryTime,
                    DATE_FORMAT(t.actualExitTime, '%Y-%m-%d %H:%i:%s') as actualExitTime,
                    DATE_FORMAT(t.createdAt, '%Y-%m-%d %H:%i:%s') as createdAt
                FROM tickets t
                JOIN users u ON t.userId = u.id
                JOIN parking_slots ps ON t.slotId = ps.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND t.status = ?';
                params.push(status);
            }

            if (startDate) {
                query += ' AND t.createdAt >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND t.createdAt <= ?';
                params.push(endDate);
            }

            query += ' ORDER BY t.createdAt DESC';

            const [tickets] = await pool.query(query, params);

            // Define CSV fields
            const fields = [
                'id',
                'userName',
                'plateNumber',
                'slotNumber',
                'status',
                'requestedEntryTime',
                'requestedExitTime',
                'actualEntryTime',
                'actualExitTime',
                'duration',
                'amount',
                'createdAt'
            ];

            // Create CSV parser
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(tickets);

            // Set headers for CSV download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=all-tickets-${new Date().toISOString().split('T')[0]}.csv`);

            return res.send(csv);
        } catch (error) {
            console.error('Error exporting all tickets:', error);
            return errorResponse(res, 'Failed to export tickets', 500, error);
        }
    }
};

module.exports = TicketController; 