const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken, errorResponse, successResponse } = require('../utils/helper');
const { sendEmail } = require('../utils/email');
const { SlotRequest } = require('../models');
const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');

// Helper function to execute queries
const executeQuery = async (query, params) => {
    const [result] = await pool.query(query, params);
    return result;
};

const AdminController = {
  /**
   * Get admin dashboard data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with dashboard data
   */
  getDashboard: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      
      // Get total users count
      const [totalUsersResult] = await connection.query(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['user']
      );
      const totalUsers = totalUsersResult[0].count;
      
      // Get pending approvals count
      const [pendingApprovalsResult] = await connection.query(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ? AND isEmailVerified = ?',
        ['user', 'pending', true]
      );
      const pendingApprovals = pendingApprovalsResult[0].count;

      // Get parking slot statistics
      const [slotStats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved
        FROM parking_slots
      `);

      const { total: totalSlots, available: availableSlots, occupied: occupiedSlots, reserved: reservedSlots } = slotStats[0];
      const utilizationRate = ((occupiedSlots + reservedSlots) / totalSlots * 100).toFixed(2);

      connection.release();

      return successResponse(res, 'Dashboard data retrieved successfully', {
        stats: {
          totalUsers,
          pendingApprovals,
          parkingSlots: {
            total: totalSlots,
            available: availableSlots,
            occupied: occupiedSlots,
            reserved: reservedSlots,
            utilizationRate
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return errorResponse(res, 'Error fetching dashboard data', 500, error);
    }
  },

  /**
   * Get users with advanced search, filtering, and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with users data
   */
  getUsers: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      console.log('Starting getUsers with query params:', req.query);
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        plateNumber,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      // Validate pagination parameters
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (validatedPage - 1) * validatedLimit;

      // Build search conditions
      let whereClause = 'WHERE u.role = "user"';
      const params = [];

      if (search) {
        whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (plateNumber) {
        whereClause += ' AND u.plateNumber LIKE ?';
        params.push(`%${plateNumber}%`);
      }
      if (status) {
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
          return errorResponse(res, 'Invalid status value', 400);
        }
        whereClause += ' AND u.status = ?';
        params.push(status);
      }

      // Get total count
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as count FROM users u ${whereClause}`,
        params
      );
      const count = countResult[0].count;

      // Validate sortBy to prevent SQL injection
      const allowedSortColumns = ['createdAt', 'name', 'email', 'status', 'plateNumber'];
      const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'createdAt';
      const validatedSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Get users with pagination
      const [users] = await connection.query(
        `SELECT 
          u.*,
          ps.id as slotId,
          ps.slotNumber,
          ps.status as slotStatus,
          ps.assignedAt,
          (SELECT COUNT(*) FROM parking_slots WHERE userId = u.id AND status = 'occupied') as activeParkingCount
        FROM users u
        LEFT JOIN parking_slots ps ON u.id = ps.userId
        ${whereClause}
        ORDER BY u.${validatedSortBy} ${validatedSortOrder}
        LIMIT ? OFFSET ?`,
        [...params, validatedLimit, offset]
      );

      // Calculate pagination info
      const totalPages = Math.ceil(count / validatedLimit);
      const hasNextPage = validatedPage < totalPages;
      const hasPrevPage = validatedPage > 1;

      return successResponse(res, 'Users retrieved successfully', {
        users,
        pagination: {
          totalUsers: count,
          totalPages,
          currentPage: validatedPage,
          limit: validatedLimit,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          search,
          status,
          plateNumber,
          sortBy: validatedSortBy,
          sortOrder: validatedSortOrder
        }
      });
    } catch (error) {
      console.error('Error in getUsers:', error);
      return errorResponse(res, 'Error fetching users', 500, error);
    } finally {
      connection.release();
    }
  },

  /**
   * Get user by ID with their assigned slot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with user data
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      const [users] = await executeQuery(
        `SELECT 
          u.*,
          ps.id as slotId,
          ps.slotNumber,
          ps.status as slotStatus,
          ps.assignedAt
        FROM users u
        LEFT JOIN parking_slots ps ON u.id = ps.userId
        WHERE u.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return errorResponse(res, 'User not found', 404);
      }

      const user = users[0];
      delete user.password;

      return successResponse(res, 'User retrieved successfully', user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return errorResponse(res, 'Error fetching user', 500, error);
    }
  },

  /**
   * Get pending user approvals
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with pending users
   */
  getPendingApprovals: async (req, res) => {
    try {
      const [pendingUsers] = await executeQuery(
        `SELECT 
          u.*,
          ps.id as slotId,
          ps.slotNumber,
          ps.status as slotStatus
        FROM users u
        LEFT JOIN parking_slots ps ON u.id = ps.userId
        WHERE u.role = ? AND u.status = ? AND u.isEmailVerified = ?
        ORDER BY u.createdAt DESC`,
        ['user', 'pending', true]
      );

      // Remove sensitive data
      const sanitizedUsers = pendingUsers.map(user => {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
      });

      return successResponse(res, 'Pending approvals retrieved successfully', sanitizedUsers);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return errorResponse(res, 'Error fetching pending approvals', 500, error);
    }
  },

  /**
   * Approve a user and assign parking slot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  approveUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { userId } = req.params;
      if (!userId) {
        return errorResponse(res, 'User ID is required', 400);
      }

      await connection.beginTransaction();

      // Check if user exists and is pending
      const [users] = await connection.query(
        'SELECT * FROM users WHERE id = ? AND role = ? AND status = ?',
        [userId, 'user', 'pending']
      );

      if (users.length === 0) {
        return errorResponse(res, 'User not found or not pending approval', 404);
      }

      // Find next available slot
      const [availableSlots] = await connection.query(
        'SELECT * FROM parking_slots WHERE status = ? ORDER BY slotNumber ASC LIMIT 1',
        ['available']
      );

      if (availableSlots.length === 0) {
        return errorResponse(res, 'No parking slots available', 400);
      }

      const slot = availableSlots[0];

      // Update user status
      await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['approved', userId]
      );

      // Assign slot to user
      await connection.query(
        'UPDATE parking_slots SET status = ?, userId = ?, assignedAt = NOW() WHERE id = ?',
        ['occupied', userId, slot.id]
      );

      // Create notification
      await connection.query(
        `INSERT INTO notifications (userId, type, message, isRead)
        VALUES (?, 'approval', ?, false)`,
        [userId, `Your account has been approved. You have been assigned parking slot ${slot.slotNumber}.`]
      );

      // Send approval email
      try {
        await sendEmail({
          to: users[0].email,
          subject: 'Account Approved',
          html: `
            <h1>Account Approved</h1>
            <p>Dear ${users[0].name},</p>
            <p>Your account has been approved. You have been assigned parking slot ${slot.slotNumber}.</p>
            <p>Best regards,<br>Parking Management Team</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the approval process if email fails
      }

      await connection.commit();
      return successResponse(res, 'User approved successfully', {
        slotNumber: slot.slotNumber,
        slotStatus: 'occupied',
        assignedAt: new Date()
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error approving user:', error);
      return errorResponse(res, 'Error approving user', 500, error);
    } finally {
      connection.release();
    }
  },

  /**
   * Reject a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  rejectUser: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      if (!rejectionReason) {
        return errorResponse(res, 'Rejection reason is required', 400);
      }

      await connection.beginTransaction();

      // Check if user exists and is pending
      const [users] = await connection.query(
        'SELECT * FROM users WHERE id = ? AND role = ? AND status = ?',
        [id, 'user', 'pending']
      );

      if (users.length === 0) {
        return errorResponse(res, 'User not found or not pending approval', 404);
      }

      // Update user status
      await connection.query(
        'UPDATE users SET status = ?, rejectionReason = ? WHERE id = ?',
        ['rejected', rejectionReason, id]
      );

      // Create notification
      await connection.query(
        `INSERT INTO notifications (userId, type, message, isRead)
        VALUES (?, 'rejection', ?, false)`,
        [id, `Your account has been rejected. Reason: ${rejectionReason}`]
      );

      // Send rejection email
      try {
        await sendEmail({
          to: users[0].email,
          subject: 'Account Rejected',
          html: `
            <h1>Account Rejected</h1>
            <p>Dear ${users[0].name},</p>
            <p>Your account has been rejected for the following reason:</p>
            <p><strong>${rejectionReason}</strong></p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>Parking Management Team</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Don't fail the rejection process if email fails
      }

      await connection.commit();
      return successResponse(res, 'User rejected successfully');
    } catch (error) {
      await connection.rollback();
      console.error('Error rejecting user:', error);
      return errorResponse(res, 'Error rejecting user', 500, error);
    } finally {
      connection.release();
    }
  },

  /**
   * Get parking statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with parking stats
   */
  getParkingStats: async (req, res) => {
    try {
      const connection = await pool.getConnection();

      // Get slot statistics
      const [stats] = await connection.query(`
        SELECT status, COUNT(*) as count
        FROM parking_slots
        GROUP BY status
      `);

      // Get total slots
      const [totalResult] = await connection.query('SELECT COUNT(*) as count FROM parking_slots');
      const totalSlots = totalResult[0].count;

      // Calculate utilization rate
      const occupiedCount = stats.find(s => s.status === 'occupied')?.count || 0;
      const utilizationRate = (occupiedCount / totalSlots * 100).toFixed(2);

      // Get recent assignments
      const [recentAssignments] = await connection.query(`
        SELECT 
          ps.*,
          u.name,
          u.plateNumber
        FROM parking_slots ps
        JOIN users u ON ps.userId = u.id
        WHERE ps.status = 'occupied'
        ORDER BY ps.assignedAt DESC
        LIMIT 5
      `);

      connection.release();

      res.json({
        stats,
        totalSlots,
        utilizationRate,
        recentAssignments
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching parking stats', error: error.message });
    }
  },

  /**
   * Manage parking slots (create, update, delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  manageSlots: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { action, slotId, data } = req.body;

      switch (action) {
        case 'create':
          const [result] = await connection.query(
            'INSERT INTO parking_slots (slotNumber, status) VALUES (?, ?)',
            [data.slotNumber, 'available']
          );
          const [newSlot] = await connection.query(
            'SELECT * FROM parking_slots WHERE id = ?',
            [result.insertId]
          );
          res.status(201).json({
            message: 'Parking slot created successfully',
            slot: newSlot[0]
          });
          break;

        case 'update':
          const [slots] = await connection.query(
            'SELECT * FROM parking_slots WHERE id = ?',
            [slotId]
          );
          if (slots.length === 0) {
            return res.status(404).json({ message: 'Parking slot not found' });
          }
          await connection.query(
            'UPDATE parking_slots SET ? WHERE id = ?',
            [data, slotId]
          );
          const [updatedSlot] = await connection.query(
            'SELECT * FROM parking_slots WHERE id = ?',
            [slotId]
          );
          res.json({
            message: 'Parking slot updated successfully',
            slot: updatedSlot[0]
          });
          break;

        case 'delete':
          const [slotToDelete] = await connection.query(
            'SELECT * FROM parking_slots WHERE id = ?',
            [slotId]
          );
          if (slotToDelete.length === 0) {
            return res.status(404).json({ message: 'Parking slot not found' });
          }
          if (slotToDelete[0].status === 'occupied') {
            return res.status(400).json({ message: 'Cannot delete occupied slot' });
          }
          await connection.query(
            'DELETE FROM parking_slots WHERE id = ?',
            [slotId]
          );
          res.json({ message: 'Parking slot deleted successfully' });
          break;

        default:
          res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error managing slots', error: error.message });
    } finally {
      connection.release();
    }
  },

  /**
   * Get admin profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with admin profile
   */
  getProfile: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [admins] = await connection.query(
        'SELECT id, name, email, role FROM admins WHERE id = ? AND role = ?',
        [req.admin.id, 'admin']
      );
      connection.release();

      if (admins.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      res.json(admins[0]);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  },

  /**
   * Update admin profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      // Get current admin from admins table
      const admins = await executeQuery(
        'SELECT * FROM admins WHERE id = ?',
        [req.admin.id]
      );
      if (admins.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      const currentAdmin = admins[0];
      // Check email availability (exclude self)
      if (email !== currentAdmin.email) {
        const existingAdmins = await executeQuery(
          'SELECT * FROM admins WHERE email = ? AND id != ?',
          [email, req.admin.id]
        );
        if (existingAdmins.length > 0) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      // Update profile
      await executeQuery(
        'UPDATE admins SET name = ?, email = ? WHERE id = ?',
        [name, email, req.admin.id]
      );
      const updatedAdmin = await executeQuery(
        'SELECT id, name, email, role FROM admins WHERE id = ?',
        [req.admin.id]
      );
      res.json({
        message: 'Profile updated successfully',
        admin: updatedAdmin[0]
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  },

  /**
   * Change admin password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      // Get admin from admins table
      const admins = await executeQuery(
        'SELECT * FROM admins WHERE id = ?',
        [req.admin.id]
      );
      if (admins.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      const admin = admins[0];
      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await executeQuery(
        'UPDATE admins SET password = ? WHERE id = ?',
        [hashedPassword, req.admin.id]
      );
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Error changing password' });
    }
  },

  /**
   * Get pending users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with pending users
   */
  getPendingUsers: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [pendingUsers] = await connection.query(
        `SELECT id, name, email, plateNumber, status, createdAt
        FROM users 
        WHERE role = ? AND status = ? AND isEmailVerified = ?
        ORDER BY createdAt DESC`,
        ['user', 'pending', true]
      );
      connection.release();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching pending users', error: error.message });
    }
  },

  /**
   * Get dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with dashboard statistics
   */
  getDashboardStats: async (req, res) => {
    try {
      const connection = await pool.getConnection();

      // Get user statistics
      const [userStats] = await connection.query(
        `SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN status = 'pending' AND isEmailVerified = 1 THEN 1 ELSE 0 END) as pendingUsers,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedUsers,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedUsers
        FROM users
        WHERE role = 'user'`
      );

      // Get parking slot statistics
      const [slotStats] = await connection.query(
        `SELECT 
          COUNT(*) as totalSlots,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableSlots,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupiedSlots
        FROM parking_slots`
      );

      // Get recent activities
      const [recentActivities] = await connection.query(
        `SELECT n.*, u.name as userName
        FROM notifications n
        JOIN users u ON n.userId = u.id
        ORDER BY n.createdAt DESC
        LIMIT 5`
      );

      connection.release();

      res.json({
        userStats: userStats[0],
        slotStats: slotStats[0],
        recentActivities
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
    }
  },

  /**
   * Get all users with their slots
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object with users and their slots
   */
  getUsersWithSlots: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [users] = await connection.query(
        `SELECT 
          u.*,
          ps.id as slotId,
          ps.slotNumber,
          ps.status as slotStatus,
          ps.assignedAt
        FROM users u
        LEFT JOIN parking_slots ps ON u.id = ps.userId`
      );
      connection.release();
      res.json(users);
    } catch (error) {
      console.error('Error getting users with slots:', error);
      res.status(500).json({ message: 'Error fetching users with slots' });
    }
  },

  // Admin: Get all slot requests
  getSlotRequests: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const result = await SlotRequest.getAllPaginated({ page, limit, search });
      return successResponse(res, 'Slot requests retrieved', result);
    } catch (error) {
      console.error('Error fetching slot requests:', error);
      return errorResponse(res, 'Error fetching slot requests', 500, error);
    }
  },

  // Admin: Approve or reject a slot request
  handleSlotRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body; // 'approved' or 'rejected'
      if (!['approved', 'rejected'].includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }
      // Get the slot request
      const request = await SlotRequest.getById(requestId);
      if (!request) {
        return errorResponse(res, 'Slot request not found', 404);
      }
      // If approving, assign the slot to the user
      if (status === 'approved') {
        // Assign slot to user (allow multiple slots per user)
        await executeQuery(
          'UPDATE parking_slots SET status = "occupied", userId = ? WHERE id = ?',
          [request.userId, request.slotId]
        );
        // Get user and slot info
        const user = await User.findById(request.userId);
        const slot = await ParkingSlot.findById(request.slotId);
        // Send email
        try {
          await sendEmail({
            to: user.email,
            subject: 'Parking Slot Request Approved',
            html: `<h1>Parking Slot Request Approved</h1><p>Dear ${user.name},</p><p>Your request for parking slot <b>${slot.slotNumber}</b> has been approved.</p><p>You can now use this slot.</p>`
          });
        } catch (emailError) {
          console.error('Error sending slot approval email:', emailError);
        }
        // Add notification
        await executeQuery(
          `INSERT INTO notifications (userId, type, message, isRead) VALUES (?, 'slot_assigned', ?, false)`,
          [user.id, `Your request for parking slot ${slot.slotNumber} has been approved.`]
        );
      }
      // Update slot request status
      await SlotRequest.updateStatus(requestId, status);
      return successResponse(res, `Slot request ${status}`);
    } catch (error) {
      console.error('Error handling slot request:', error);
      return errorResponse(res, 'Error handling slot request', 500, error);
    }
  },

  /**
   * Get all parking slots with pagination, search, and status filter
   */
  getAllSlotsPaginated: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
      const result = await ParkingSlot.getAllPaginated({ page, limit, search, status });
      return successResponse(res, 'Parking slots retrieved', result);
    } catch (error) {
      console.error('Error fetching parking slots:', error);
      return errorResponse(res, 'Error fetching parking slots', 500, error);
    }
  }
};

module.exports = AdminController;