const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async create(adminData) {
    const { name, email, password, role = 'admin' } = adminData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE admins SET ${setClause} WHERE id = ?`;
    
    await db.query(query, [...values, id]);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAllAdmins() {
    const [rows] = await db.query('SELECT id, name, email, role, createdAt FROM admins');
    return rows;
  }

  static async getDashboardStats() {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE status = 'approved') as totalUsers,
        (SELECT COUNT(*) FROM parking_slots WHERE status = 'available') as availableSlots,
        (SELECT COUNT(*) FROM parking_slots WHERE status = 'occupied') as occupiedSlots,
        (SELECT COUNT(*) FROM users WHERE status = 'pending') as pendingApprovals
    `);
    return stats[0];
  }
}

module.exports = Admin;