const db = require('../config/database');

class Ticket {
    static async create({ userId, slotId, requestedEntryTime, requestedExitTime }) {
        const [result] = await db.query(
            'INSERT INTO tickets (userId, slotId, requestedEntryTime, requestedExitTime, status) VALUES (?, ?, ?, ?, "pending")',
            [userId, slotId, requestedEntryTime, requestedExitTime]
        );
        return result.insertId;
    }

    static async activateTicket(ticketId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get ticket details
            const [tickets] = await connection.query(
                'SELECT * FROM tickets WHERE id = ? AND status = "pending"',
                [ticketId]
            );

            if (tickets.length === 0) {
                throw new Error('Ticket not found or already activated');
            }

            const ticket = tickets[0];
            const now = new Date();

            // Update ticket status to active and set actual entry time
            await connection.query(
                `UPDATE tickets 
                SET status = 'active', actualEntryTime = ?
                WHERE id = ?`,
                [now, ticketId]
            );

            await connection.commit();
            return { ticketId, actualEntryTime: now };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async completeTicket(ticketId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get ticket details
            const [tickets] = await connection.query(
                'SELECT * FROM tickets WHERE id = ? AND status = "active"',
                [ticketId]
            );

            if (tickets.length === 0) {
                throw new Error('Ticket not found or already completed');
            }

            const ticket = tickets[0];
            const now = new Date();
            const actualEntryTime = new Date(ticket.actualEntryTime);
            
            // Calculate duration in minutes
            const duration = Math.ceil((now - actualEntryTime) / (1000 * 60));
            
            // Calculate amount (1000 RWF per hour, prorated for partial hours)
            const amount = Math.ceil(duration / 60 * 1000);

            // Update ticket
            await connection.query(
                `UPDATE tickets 
                SET actualExitTime = ?, duration = ?, amount = ?, status = 'completed'
                WHERE id = ?`,
                [now, duration, amount, ticketId]
            );

            await connection.commit();
            return { duration, amount, actualExitTime: now };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getActiveTicketByUser(userId) {
        const [tickets] = await db.query(
            `SELECT t.*, ps.slotNumber, u.name as userName, u.plateNumber
            FROM tickets t
            JOIN parking_slots ps ON t.slotId = ps.id
            JOIN users u ON t.userId = u.id
            WHERE t.userId = ? AND t.status IN ('pending', 'active')
            ORDER BY t.createdAt DESC
            LIMIT 1`,
            [userId]
        );
        return tickets[0];
    }

    static async getUserTickets(userId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        
        // Get total count
        const [countRows] = await db.query(
            'SELECT COUNT(*) as count FROM tickets WHERE userId = ?',
            [userId]
        );
        const total = countRows[0].count;

        // Get paginated tickets
        const [tickets] = await db.query(
            `SELECT t.*, ps.slotNumber
            FROM tickets t
            JOIN parking_slots ps ON t.slotId = ps.id
            WHERE t.userId = ?
            ORDER BY t.createdAt DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        return { tickets, total, page, limit };
    }

    static async getActiveTickets() {
        const [tickets] = await db.query(
            `SELECT t.*, u.name as userName, u.plateNumber, ps.slotNumber
            FROM tickets t
            JOIN users u ON t.userId = u.id
            JOIN parking_slots ps ON t.slotId = ps.id
            WHERE t.status IN ('pending', 'active')
            ORDER BY t.requestedEntryTime ASC`
        );
        return tickets;
    }

    static async getAllTickets({ page = 1, limit = 10, status = null } = {}) {
        const offset = (page - 1) * limit;
        let whereClause = '1=1';
        let params = [];

        if (status) {
            whereClause += ' AND t.status = ?';
            params.push(status);
        }

        // Get total count
        const [countRows] = await db.query(
            `SELECT COUNT(*) as count FROM tickets t WHERE ${whereClause}`,
            params
        );
        const total = countRows[0].count;

        // Get paginated tickets
        const [tickets] = await db.query(
            `SELECT t.*, u.name as userName, u.plateNumber, ps.slotNumber
            FROM tickets t
            JOIN users u ON t.userId = u.id
            JOIN parking_slots ps ON t.slotId = ps.id
            WHERE ${whereClause}
            ORDER BY t.createdAt DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return { tickets, total, page, limit };
    }

    static async calculateEstimatedAmount(requestedEntryTime, requestedExitTime) {
        const entryTime = new Date(requestedEntryTime);
        const exitTime = new Date(requestedExitTime);
        
        // Calculate duration in minutes
        const duration = Math.ceil((exitTime - entryTime) / (1000 * 60));
        
        // Calculate amount (1000 RWF per hour, prorated for partial hours)
        const amount = Math.ceil(duration / 60 * 1000);
        
        return { duration, amount };
    }
}

module.exports = Ticket; 