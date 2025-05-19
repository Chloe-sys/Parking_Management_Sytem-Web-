const mysql = require('mysql2/promise');
const pool = require('../config/database');

// Helper function to execute queries
const executeQuery = async (query, params) => {
    const [result] = await pool.query(query, params);
    return result;
};

const ParkingSlotController = {
  // Get all available parking slots
  getAvailableSlots: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      let { page = 1, limit = 10, search = '' } = req.query;
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(50, parseInt(limit)));
      const offset = (page - 1) * limit;
      // Sanitize search input
      search = String(search).replace(/[^a-zA-Z0-9\s-]/g, '');
      let whereClause = 'status = \'available\'';
      let params = [];
      if (search) {
        whereClause += ' AND slotNumber LIKE ?';
        params.push(`%${search}%`);
      }
      // Get total count
      const [countRows] = await connection.query(
        `SELECT COUNT(*) as count FROM parking_slots WHERE ${whereClause}`,
        params
      );
      const total = countRows[0].count;
      // Get paginated results
      const [slots] = await connection.query(
        `SELECT * FROM parking_slots WHERE ${whereClause} ORDER BY slotNumber LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
      connection.release();
      res.json({ slots, total, page, limit });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching available slots', error: error.message });
    }
  },

  // Get all occupied parking slots
  getOccupiedSlots: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [slots] = await connection.query(
        `SELECT ps.id, ps.slotNumber, ps.status, ps.location, ps.assignedAt,
        u.name as userName, u.plateNumber
        FROM parking_slots ps
        JOIN users u ON ps.userId = u.id
        WHERE ps.status = 'occupied'
        ORDER BY ps.slotNumber`
      );
      connection.release();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching occupied slots', error: error.message });
    }
  },

  // Get user's assigned slot
  getMySlot: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [slots] = await connection.query(
        `SELECT id, slotNumber, status, location, assignedAt
        FROM parking_slots
        WHERE userId = ? AND status = 'occupied'`,
        [req.user.id]
      );
      connection.release();

      if (slots.length === 0) {
        return res.status(404).json({ message: 'No parking slot assigned' });
      }

      res.json(slots[0]);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching your slot', error: error.message });
    }
  },

  // User releases their slot
  releaseSlot: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if user has an assigned slot
      const [slots] = await connection.query(
        `SELECT id FROM parking_slots
        WHERE userId = ? AND status = 'occupied'`,
        [req.user.id]
      );

      if (slots.length === 0) {
        return res.status(404).json({ message: 'No parking slot assigned to release' });
      }

      // Release the slot
      await connection.query(
        `UPDATE parking_slots
        SET status = 'available', userId = NULL, assignedAt = NULL
        WHERE id = ?`,
        [slots[0].id]
      );

      // Create notification
      await connection.query(
        `INSERT INTO notifications (userId, type, message, isRead)
        VALUES (?, 'slot_released', 'You have released your parking slot.', false)`,
        [req.user.id]
      );

      await connection.commit();
      res.json({ message: 'Parking slot released successfully' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: 'Error releasing slot', error: error.message });
    } finally {
      connection.release();
    }
  },

  // Admin: Get all slots
  getAllSlots: async (req, res) => {
    try {
      const slots = await executeQuery(`
        SELECT 
          ps.*,
          u.name as userName,
          u.email as userEmail,
          u.plateNumber
        FROM parking_slots ps
        LEFT JOIN users u ON ps.userId = u.id
        ORDER BY ps.slotNumber
      `);

      res.json(slots);
    } catch (error) {
      console.error('Error fetching parking slots:', error);
      res.status(500).json({ message: 'Error fetching parking slots' });
    }
  },

  // Admin: Get slot statistics
  getSlotStats: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [stats] = await connection.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved
        FROM parking_slots`
      );

      const [recentAssignments] = await connection.query(
        `SELECT ps.*, u.name as userName, u.plateNumber
        FROM parking_slots ps
        JOIN users u ON ps.userId = u.id
        WHERE ps.status = 'occupied'
        ORDER BY ps.assignedAt DESC
        LIMIT 5`
      );

      connection.release();

      const { total, available, occupied, reserved } = stats[0];
      const utilizationRate = ((occupied + reserved) / total * 100).toFixed(2);

      res.json({
        stats: {
          total,
          available,
          occupied,
          reserved,
          utilizationRate
        },
        recentAssignments
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching slot statistics', error: error.message });
    }
  },

  // Admin: Create new slot
  createSlot: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { slotNumber } = req.body;

      // Check if slot number already exists
      const [existingSlots] = await connection.query(
        'SELECT * FROM parking_slots WHERE slotNumber = ?',
        [slotNumber]
      );

      if (existingSlots.length > 0) {
        return res.status(400).json({ message: 'Slot number already exists' });
      }

      // Create new slot
      const [result] = await connection.query(
        'INSERT INTO parking_slots (slotNumber, status) VALUES (?, ?)',
        [slotNumber, 'available']
      );

      // Get the newly created slot
      const [newSlot] = await connection.query(
        'SELECT * FROM parking_slots WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        message: 'Parking slot created successfully',
        slot: newSlot[0]
      });
    } catch (error) {
      console.error('Error creating parking slot:', error);
      res.status(500).json({ message: 'Error creating parking slot' });
    } finally {
      connection.release();
    }
  },

  // Admin: Update slot
  updateSlot: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { slotId } = req.params;
      const { slotNumber, status } = req.body;

      // Check if slot exists
      const [slots] = await connection.query(
        'SELECT * FROM parking_slots WHERE id = ?',
        [slotId]
      );

      if (slots.length === 0) {
        return res.status(404).json({ message: 'Parking slot not found' });
      }

      // Check if new slot number already exists (excluding current slot)
      if (slotNumber) {
        const [existingSlots] = await connection.query(
          'SELECT * FROM parking_slots WHERE slotNumber = ? AND id != ?',
          [slotNumber, slotId]
        );
        if (existingSlots.length > 0) {
          return res.status(400).json({ message: 'Slot number already exists' });
        }
      }

      // Update slot
      await connection.query(
        'UPDATE parking_slots SET slotNumber = ?, status = ? WHERE id = ?',
        [slotNumber, status, slotId]
      );

      const [updatedSlot] = await connection.query(
        'SELECT * FROM parking_slots WHERE id = ?',
        [slotId]
      );

      res.json({
        message: 'Parking slot updated successfully',
        slot: updatedSlot[0]
      });
    } catch (error) {
      console.error('Error updating parking slot:', error);
      res.status(500).json({ message: 'Error updating parking slot' });
    } finally {
      connection.release();
    }
  },

  // Admin: Delete slot
  deleteSlot: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { slotId } = req.params;

      // Check if slot exists and is not occupied
      const [slots] = await connection.query(
        'SELECT * FROM parking_slots WHERE id = ?',
        [slotId]
      );

      if (slots.length === 0) {
        return res.status(404).json({ message: 'Parking slot not found' });
      }

      if (slots[0].status === 'occupied') {
        return res.status(400).json({ message: 'Cannot delete occupied slot' });
      }

      // Delete slot
      await connection.query(
        'DELETE FROM parking_slots WHERE id = ?',
        [slotId]
      );

      res.json({ message: 'Parking slot deleted successfully' });
    } catch (error) {
      console.error('Error deleting parking slot:', error);
      res.status(500).json({ message: 'Error deleting parking slot' });
    } finally {
      connection.release();
    }
  },

  // Admin: Assign slot to user
  assignSlotToUser: async (req, res) => {
    try {
        const { slotId } = req.params;
        const { userId } = req.body;
        // First check if user already has a slot
        const [existingSlots] = await pool.query(
            'SELECT * FROM parking_slots WHERE userId = ?',
            [userId]
        );
        if (existingSlots.length > 0) {
            return res.status(400).json({
                message: 'User already has an assigned slot. Please release the current slot before assigning a new one.'
            });
        }
        // Check if slot exists and is available
        const [slots] = await pool.query(
            'SELECT * FROM parking_slots WHERE id = ?',
            [slotId]
        );
        if (slots.length === 0) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        const slot = slots[0];
        if (slot.userId !== null) {
            return res.status(400).json({ message: 'Slot is already assigned to another user' });
        }
        // Assign slot to user
        await pool.query(
            'UPDATE parking_slots SET userId = ?, status = "assigned" WHERE id = ?',
            [userId, slotId]
        );
        // Create notification for the user
        await pool.query(
            'INSERT INTO notifications (userId, type, message) VALUES (?, "approval", ?)',
            [userId, `You have been assigned parking slot ${slot.slotNumber}.`]
        );
        // Fetch the updated slot info with user details
        const [updatedSlotRows] = await pool.query(
            `SELECT ps.*, u.name as userName, u.email as userEmail, u.plateNumber
             FROM parking_slots ps
             LEFT JOIN users u ON ps.userId = u.id
             WHERE ps.id = ?`,
            [slotId]
        );
        const updatedSlot = updatedSlotRows[0];
        res.json({
            message: 'Slot assigned successfully',
            slot: updatedSlot
        });
    } catch (error) {
        console.error('Error assigning slot:', error);
        res.status(500).json({ message: 'Error assigning slot' });
    }
  }

};

module.exports = ParkingSlotController; 