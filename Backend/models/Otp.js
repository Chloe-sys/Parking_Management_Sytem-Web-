const pool = require('../config/database');

class Otp {
    static async create({ email, code, type, expiresAt }) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                `INSERT INTO otps (email, code, type, expiresAt)
                VALUES (?, ?, ?, ?)`,
                [email, code, type, expiresAt]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    static async findByEmailAndCode(email, code, type) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT * FROM otps 
                WHERE email = ? AND code = ? AND type = ? 
                AND expiresAt > NOW() AND isUsed = false`,
                [email, code, type]
            );
            return rows[0];
        } finally {
            connection.release();
        }
    }

    static async markAsUsed(email, code) {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                'UPDATE otps SET isUsed = true WHERE email = ? AND code = ?',
                [email, code]
            );
        } finally {
            connection.release();
        }
    }

    static async deleteExpired() {
        const connection = await pool.getConnection();
        try {
            await connection.query('DELETE FROM otps WHERE expiresAt < NOW()');
        } finally {
            connection.release();
        }
    }
}

module.exports = Otp; 