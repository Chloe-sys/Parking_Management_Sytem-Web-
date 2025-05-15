const pool = require('../config/database');
const { hashPassword, comparePassword, errorResponse, successResponse } = require('../utils/helper');

// Helper function to execute queries
const executeQuery = async (query, params) => {
    const [result] = await pool.query(query, params);
    return result;
};

const userController = {
    // Get user dashboard data
    getDashboard: async (req, res) => {
        try {
            const userId = req.user.id;
            console.log('Fetching dashboard for user ID:', userId);

            // Get user's assigned slot
            const [slots] = await pool.query(
                `SELECT * FROM parking_slots WHERE userId = ?`,
                [userId]
            );
            console.log('Found slots:', slots);

            // Get user's recent notifications
            const notifications = await executeQuery(
                `SELECT 
                    id,
                    type,
                    message,
                    isRead,
                    createdAt
                FROM notifications 
                WHERE userId = ? 
                ORDER BY createdAt DESC 
                LIMIT 5`,
                [userId]
            );

            // Format the response
            const response = {
                slot: slots.length > 0 ? {
                    id: slots[0].id,
                    slotNumber: slots[0].slotNumber,
                    status: slots[0].status,
                    assignedAt: slots[0].createdAt
                } : null,
                notifications: notifications.map(notification => ({
                    id: notification.id,
                    type: notification.type,
                    message: notification.message,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt
                }))
            };

            console.log('Dashboard response:', response);
            return successResponse(res, 'Dashboard data retrieved successfully', response);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            return errorResponse(res, 'Error fetching dashboard data', 500, error);
        }
    },

    // Get user profile
    getProfile: async (req, res) => {
        try {
            const [users] = await executeQuery(
                'SELECT id, name, email, plateNumber, status FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return errorResponse(res, 'User not found', 404);
            }

            return successResponse(res, 'Profile retrieved successfully', users[0]);
        } catch (error) {
            console.error('Error fetching profile:', error);
            return errorResponse(res, 'Error fetching profile', 500, error);
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const { name, email } = req.body;

            // Validate input
            if (!name || !email) {
                return errorResponse(res, 'Name and email are required', 400);
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return errorResponse(res, 'Invalid email format', 400);
            }

            // Check if email is already taken by another user
            const [existingUsers] = await executeQuery(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, req.user.id]
            );

            if (existingUsers.length > 0) {
                return errorResponse(res, 'Email already in use', 400);
            }

            // Update user profile
            await executeQuery(
                'UPDATE users SET name = ?, email = ? WHERE id = ?',
                [name, email, req.user.id]
            );

            // Get updated user data
            const [updatedUser] = await executeQuery(
                'SELECT id, name, email, plateNumber, status FROM users WHERE id = ?',
                [req.user.id]
            );

            return successResponse(res, 'Profile updated successfully', updatedUser[0]);
        } catch (error) {
            console.error('Error updating profile:', error);
            return errorResponse(res, 'Error updating profile', 500, error);
        }
    },

    // Change user password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            // Validate input
            if (!currentPassword || !newPassword) {
                return errorResponse(res, 'Current password and new password are required', 400);
            }

            // Validate password strength
            if (newPassword.length < 8) {
                return errorResponse(res, 'New password must be at least 8 characters long', 400);
            }

            // Get user's current password
            const [users] = await executeQuery(
                'SELECT password FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return errorResponse(res, 'User not found', 404);
            }

            // Verify current password
            const isMatch = await comparePassword(currentPassword, users[0].password);
            if (!isMatch) {
                return errorResponse(res, 'Current password is incorrect', 401);
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password
            await executeQuery(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, req.user.id]
            );

            return successResponse(res, 'Password changed successfully');
        } catch (error) {
            console.error('Error changing password:', error);
            return errorResponse(res, 'Error changing password', 500, error);
        }
    },

    // Get user notifications
    getNotifications: async (req, res) => {
        try {
            const [notifications] = await executeQuery(
                `SELECT * FROM notifications 
                WHERE userId = ? 
                ORDER BY createdAt DESC`,
                [req.user.id]
            );

            return successResponse(res, 'Notifications retrieved successfully', notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return errorResponse(res, 'Error fetching notifications', 500, error);
        }
    },

    // Mark notification as read
    markNotificationAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;

            // Validate notification exists and belongs to user
            const [notifications] = await executeQuery(
                'SELECT * FROM notifications WHERE id = ? AND userId = ?',
                [notificationId, req.user.id]
            );

            if (notifications.length === 0) {
                return errorResponse(res, 'Notification not found', 404);
            }

            await executeQuery(
                'UPDATE notifications SET isRead = true WHERE id = ? AND userId = ?',
                [notificationId, req.user.id]
            );

            return successResponse(res, 'Notification marked as read');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return errorResponse(res, 'Error marking notification as read', 500, error);
        }
    },

    // Mark all notifications as read
    markAllNotificationsAsRead: async (req, res) => {
        try {
            await executeQuery(
                'UPDATE notifications SET isRead = true WHERE userId = ? AND isRead = false',
                [req.user.id]
            );

            return successResponse(res, 'All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return errorResponse(res, 'Error marking all notifications as read', 500, error);
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;

            // Validate notification exists and belongs to user
            const [notifications] = await executeQuery(
                'SELECT * FROM notifications WHERE id = ? AND userId = ?',
                [notificationId, req.user.id]
            );

            if (notifications.length === 0) {
                return errorResponse(res, 'Notification not found', 404);
            }

            await executeQuery(
                'DELETE FROM notifications WHERE id = ? AND userId = ?',
                [notificationId, req.user.id]
            );

            return successResponse(res, 'Notification deleted successfully');
        } catch (error) {
            console.error('Error deleting notification:', error);
            return errorResponse(res, 'Error deleting notification', 500, error);
        }
    }
};

module.exports = userController;