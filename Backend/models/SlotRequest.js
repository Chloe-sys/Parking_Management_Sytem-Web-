const db = require('../config/database');

class SlotRequest {
  static async create({ userId, slotId }) {
    const [result] = await db.query(
      'INSERT INTO slot_requests (userId, slotId) VALUES (?, ?)',
      [userId, slotId]
    );
    return result.insertId;
  }

  static async getByUser(userId) {
    const [rows] = await db.query(
      `SELECT sr.*, ps.slotNumber, ps.status as slotStatus
       FROM slot_requests sr
       JOIN parking_slots ps ON sr.slotId = ps.id
       WHERE sr.userId = ?
       ORDER BY sr.createdAt DESC`,
      [userId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await db.query(
      `SELECT sr.*, u.name as userName, u.email as userEmail, ps.slotNumber
       FROM slot_requests sr
       JOIN users u ON sr.userId = u.id
       JOIN parking_slots ps ON sr.slotId = ps.id
       ORDER BY sr.createdAt DESC`
    );
    return rows;
  }

  static async updateStatus(id, status) {
    await db.query(
      'UPDATE slot_requests SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async getById(id) {
    const [rows] = await db.query(
      'SELECT * FROM slot_requests WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async getByUserPaginated(userId, { page = 1, limit = 10, search = '' }) {
    page = Math.max(1, parseInt(page));
    limit = Math.max(1, Math.min(50, parseInt(limit)));
    const offset = (page - 1) * limit;
    search = String(search).replace(/[^a-zA-Z0-9\s-]/g, '');
    let whereClause = 'sr.userId = ?';
    let params = [userId];
    if (search) {
      whereClause += ' AND ps.slotNumber LIKE ?';
      params.push(`%${search}%`);
    }
    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count FROM slot_requests sr JOIN parking_slots ps ON sr.slotId = ps.id WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].count;
    // Get paginated results
    const [rows] = await db.query(
      `SELECT sr.*, ps.slotNumber, ps.status as slotStatus
       FROM slot_requests sr
       JOIN parking_slots ps ON sr.slotId = ps.id
       WHERE ${whereClause}
       ORDER BY sr.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { slotRequests: rows, total, page, limit };
  }

  static async getAllPaginated({ page = 1, limit = 10, search = '' }) {
    page = Math.max(1, parseInt(page));
    limit = Math.max(1, Math.min(50, parseInt(limit)));
    const offset = (page - 1) * limit;
    // Sanitize search input
    search = String(search).replace(/[^a-zA-Z0-9\s-]/g, '');
    let whereClause = '1=1';
    let params = [];
    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR ps.slotNumber LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count FROM slot_requests sr JOIN users u ON sr.userId = u.id JOIN parking_slots ps ON sr.slotId = ps.id WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].count;
    // Get paginated results
    const [rows] = await db.query(
      `SELECT sr.*, u.name as userName, u.email as userEmail, ps.slotNumber
       FROM slot_requests sr
       JOIN users u ON sr.userId = u.id
       JOIN parking_slots ps ON sr.slotId = ps.id
       WHERE ${whereClause}
       ORDER BY sr.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { slotRequests: rows, total, page, limit };
  }
}

module.exports = SlotRequest; 