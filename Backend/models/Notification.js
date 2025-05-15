const db = require('../config/database');

class Notification {
  static async create(notificationData) {
    const { userId, type, message } = notificationData;
    const [result] = await db.query(
      'INSERT INTO notifications (userId, type, message, isRead) VALUES (?, ?, ?, false)',
      [userId, type, message]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    return rows[0];
  }

  static async getUserNotifications(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE userId = ?',
      [userId]
    );
    
    return {
      notifications: rows,
      total: countResult.total
    };
  }

  static async markAsRead(id) {
    await db.query('UPDATE notifications SET isRead = true WHERE id = ?', [id]);
  }

  static async getUnreadCount(userId) {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = false',
      [userId]
    );
    return result.count;
  }

  static async deleteOldNotifications(days = 30) {
    await db.query(
      'DELETE FROM notifications WHERE createdAt < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
  }

  static async createSystemNotification(message) {
    const [result] = await db.query(
      'INSERT INTO notifications (type, message, isSystem) VALUES (?, ?, true)',
      ['system', message]
    );
    return result.insertId;
  }
}

module.exports = Notification; 