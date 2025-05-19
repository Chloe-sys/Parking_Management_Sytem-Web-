const SlotRequest = require('../models/SlotRequest');
const ParkingSlot = require('../models/ParkingSlot');
const { validateRequest } = require('../utils/validators');

class SlotRequestController {
    static async createRequest(req, res) {
        try {
            const { requestedEntryTime, requestedExitTime, reason } = req.body;
            const userId = req.user.id;

            // Validate request
            const validationError = validateRequest({
                requestedEntryTime,
                requestedExitTime,
                reason
            });

            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            // Check if user has any active requests
            const activeRequests = await SlotRequest.getUserRequests(userId, { limit: 1 });
            if (activeRequests.requests.length > 0 && 
                ['pending', 'approved'].includes(activeRequests.requests[0].status)) {
                return res.status(400).json({ 
                    error: 'You already have an active request or approved slot' 
                });
            }

            // Check if user has any active tickets
            const activeTicket = await Ticket.getActiveTicketByUser(userId);
            if (activeTicket) {
                return res.status(400).json({ 
                    error: 'You already have an active ticket' 
                });
            }

            // Create the request
            const requestId = await SlotRequest.create({
                userId,
                requestedEntryTime,
                requestedExitTime,
                reason
            });

            res.status(201).json({
                message: 'Slot request created successfully',
                requestId
            });
        } catch (error) {
            console.error('Error creating slot request:', error);
            res.status(500).json({ error: 'Failed to create slot request' });
        }
    }

    static async approveRequest(req, res) {
        try {
            const { requestId, slotId } = req.body;

            // Validate input
            if (!requestId || !slotId) {
                return res.status(400).json({ 
                    error: 'Request ID and slot ID are required' 
                });
            }

            // Check if slot is available
            const slot = await ParkingSlot.getById(slotId);
            if (!slot || slot.status !== 'available') {
                return res.status(400).json({ 
                    error: 'Selected slot is not available' 
                });
            }

            // Approve request and create ticket
            const result = await SlotRequest.approve(requestId, slotId);

            res.json({
                message: 'Request approved and ticket created successfully',
                ...result
            });
        } catch (error) {
            console.error('Error approving request:', error);
            if (error.message.includes('not found') || error.message.includes('already processed')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to approve request' });
        }
    }

    static async rejectRequest(req, res) {
        try {
            const { requestId, reason } = req.body;

            // Validate input
            if (!requestId || !reason) {
                return res.status(400).json({ 
                    error: 'Request ID and rejection reason are required' 
                });
            }

            const success = await SlotRequest.reject(requestId, reason);
            if (!success) {
                return res.status(400).json({ 
                    error: 'Request not found or already processed' 
                });
            }

            res.json({ message: 'Request rejected successfully' });
        } catch (error) {
            console.error('Error rejecting request:', error);
            res.status(500).json({ error: 'Failed to reject request' });
        }
    }

    static async getUserRequests(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const requests = await SlotRequest.getUserRequests(userId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json(requests);
        } catch (error) {
            console.error('Error fetching user requests:', error);
            res.status(500).json({ error: 'Failed to fetch requests' });
        }
    }

    static async getPendingRequests(req, res) {
        try {
            const requests = await SlotRequest.getPendingRequests();
            res.json(requests);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            res.status(500).json({ error: 'Failed to fetch pending requests' });
        }
    }

    static async getAllRequests(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const requests = await SlotRequest.getAllRequests({
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });

            res.json(requests);
        } catch (error) {
            console.error('Error fetching all requests:', error);
            res.status(500).json({ error: 'Failed to fetch requests' });
        }
    }
}

module.exports = SlotRequestController; 