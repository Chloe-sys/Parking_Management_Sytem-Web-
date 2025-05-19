const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, plateNumber, preferredEntryTime, preferredExitTime, status = 'pending' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, plateNumber, preferredEntryTime, preferredExitTime, status, isEmailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, plateNumber, preferredEntryTime, preferredExitTime, status, false]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    await db.query(query, [...values, id]);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async verifyEmail(id) {
    await db.query('UPDATE users SET isEmailVerified = true WHERE id = ?', [id]);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getPendingUsers() {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE status = "pending" AND isEmailVerified = true'
    );
    return rows;
  }

  static async getUsersWithSlots() {
    const [rows] = await db.query(`
      SELECT u.*, ps.slotNumber, ps.status as slotStatus, ps.assignedAt
      FROM users u
      LEFT JOIN parking_slots ps ON u.id = ps.userId
      WHERE u.status = 'approved'
    `);
    return rows;
  }
}

module.exports = User;