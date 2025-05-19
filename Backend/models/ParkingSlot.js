const db = require('../config/database');

class ParkingSlot {
  static async create(slotData) {
    const { slotNumber, status = 'available' } = slotData;
    const [result] = await db.query(
      'INSERT INTO parking_slots (slotNumber, status) VALUES (?, ?)',
      [slotNumber, status]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM parking_slots WHERE id = ?', [id]);
    return rows[0];
  }

  static async findBySlotNumber(slotNumber) {
    const [rows] = await db.query('SELECT * FROM parking_slots WHERE slotNumber = ?', [slotNumber]);
    return rows[0];
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE parking_slots SET ${setClause} WHERE id = ?`;
    
    await db.query(query, [...values, id]);
  }

  static async delete(id) {
    await db.query('DELETE FROM parking_slots WHERE id = ?', [id]);
  }

  static async getAvailableSlots() {
    const [rows] = await db.query('SELECT * FROM parking_slots WHERE status = "available"');
    return rows;
  }

  static async getOccupiedSlots() {
    const [rows] = await db.query(`
      SELECT ps.*, u.name as userName, u.plateNumber
      FROM parking_slots ps
      LEFT JOIN users u ON ps.userId = u.id
      WHERE ps.status = "occupied"
    `);
    return rows;
  }

  static async assignSlot(slotId, userId) {
    await db.query(
      'UPDATE parking_slots SET status = "occupied", userId = ?, assignedAt = NOW() WHERE id = ?',
      [userId, slotId]
    );
  }

  static async releaseSlot(slotId) {
    await db.query(
      'UPDATE parking_slots SET status = "available", userId = NULL, assignedAt = NULL WHERE id = ?',
      [slotId]
    );
  }

  static async getSlotStats() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved
      FROM parking_slots
    `);
    return rows[0];
  }

  static async getRecentAssignments(limit = 5) {
    const [rows] = await db.query(`
      SELECT ps.*, u.name as userName, u.plateNumber
      FROM parking_slots ps
      LEFT JOIN users u ON ps.userId = u.id
      WHERE ps.status = "occupied"
      ORDER BY ps.assignedAt DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  static async getAllPaginated({ page = 1, limit = 10, search = '', status = 'all' }) {
    page = Math.max(1, parseInt(page));
    limit = Math.max(1, Math.min(50, parseInt(limit)));
    const offset = (page - 1) * limit;
    // Sanitize search input
    search = String(search).replace(/[^a-zA-Z0-9\s-]/g, '');
    let whereClause = '1=1';
    let params = [];
    if (search) {
      whereClause += ' AND (ps.slotNumber LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.plateNumber LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status && status !== 'all') {
      whereClause += ' AND ps.status = ?';
      params.push(status);
    }
    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM parking_slots ps
       LEFT JOIN users u ON ps.userId = u.id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].count;
    // Get paginated results with user information
    const [rows] = await db.query(
      `SELECT ps.*, 
              u.id as userId,
              u.name as userName, 
              u.email as userEmail, 
              u.plateNumber,
              u.status as userStatus
       FROM parking_slots ps
       LEFT JOIN users u ON ps.userId = u.id
       WHERE ${whereClause}
       ORDER BY ps.slotNumber ASC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { slots: rows, total, page, limit };
  }
}

module.exports = ParkingSlot; 