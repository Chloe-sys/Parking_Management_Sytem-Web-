const db = require('../config/database');

class SlotRequest {
  static async create({ userId, requestedEntryTime, requestedExitTime, reason }) {
    const [result] = await db.query(
      'INSERT INTO slot_requests (userId, requestedEntryTime, requestedExitTime, reason, status) VALUES (?, ?, ?, ?, "pending")',
      [userId, requestedEntryTime, requestedExitTime, reason]
    );
    return result.insertId;
  }

  static async approve(requestId, slotId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get request details
      const [requests] = await connection.query(
        'SELECT * FROM slot_requests WHERE id = ? AND status = "pending"',
        [requestId]
      );

      if (requests.length === 0) {
        throw new Error('Request not found or already processed');
      }

      const request = requests[0];

      // Update request status
      await connection.query(
        'UPDATE slot_requests SET status = "approved", approvedAt = NOW() WHERE id = ?',
        [requestId]
      );

      // Update parking slot
      await connection.query(
        'UPDATE parking_slots SET userId = ?, status = "reserved", assignedAt = NOW() WHERE id = ?',
        [request.userId, slotId]
      );

      // Create a pending ticket
      const [ticketResult] = await connection.query(
        'INSERT INTO tickets (userId, slotId, requestedEntryTime, requestedExitTime, status) VALUES (?, ?, ?, ?, "pending")',
        [request.userId, slotId, request.requestedEntryTime, request.requestedExitTime]
      );

      await connection.commit();
      return {
        requestId,
        slotId,
        ticketId: ticketResult.insertId,
        requestedEntryTime: request.requestedEntryTime,
        requestedExitTime: request.requestedExitTime
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async reject(requestId, reason) {
    const [result] = await db.query(
      'UPDATE slot_requests SET status = "rejected", rejectionReason = ?, rejectedAt = NOW() WHERE id = ? AND status = "pending"',
      [reason, requestId]
    );
    return result.affectedRows > 0;
  }

  static async getUserRequests(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    
    // Get total count
    const [countRows] = await db.query(
      'SELECT COUNT(*) as count FROM slot_requests WHERE userId = ?',
      [userId]
    );
    const total = countRows[0].count;

    // Get paginated requests
    const [requests] = await db.query(
      `SELECT sr.*, 
          CASE 
              WHEN sr.status = 'approved' THEN ps.slotNumber
              ELSE NULL
          END as slotNumber
      FROM slot_requests sr
      LEFT JOIN parking_slots ps ON sr.userId = ps.userId AND sr.status = 'approved'
      WHERE sr.userId = ?
      ORDER BY sr.createdAt DESC
      LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return { requests, total, page, limit };
  }

  static async getPendingRequests() {
    const [requests] = await db.query(
      `SELECT sr.*, u.name as userName, u.plateNumber
      FROM slot_requests sr
      JOIN users u ON sr.userId = u.id
      WHERE sr.status = 'pending'
      ORDER BY sr.requestedEntryTime ASC`
    );
    return requests;
  }

  static async getAllRequests({ page = 1, limit = 10, status = null } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    let params = [];

    if (status) {
      whereClause += ' AND sr.status = ?';
      params.push(status);
    }

    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count FROM slot_requests sr WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].count;

    // Get paginated requests
    const [requests] = await db.query(
      `SELECT sr.*, u.name as userName, u.plateNumber,
          CASE 
              WHEN sr.status = 'approved' THEN ps.slotNumber
              ELSE NULL
          END as slotNumber
      FROM slot_requests sr
      JOIN users u ON sr.userId = u.id
      LEFT JOIN parking_slots ps ON sr.userId = ps.userId AND sr.status = 'approved'
      WHERE ${whereClause}
      ORDER BY sr.createdAt DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { requests, total, page, limit };
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