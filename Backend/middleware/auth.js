const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Helper function to execute queries
const executeQuery = async (query, params) => {
    const [result] = await query(query, params);
    return result;
};

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(
        { 
            id: user.id, 
            role: user.role,
            email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth Header:', authHeader);

        if (!authHeader) {
            console.log('No authorization header found');
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Extract token
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : authHeader;
        
        console.log('Extracted token:', token);

        if (!token) {
            console.log('No token found');
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);

            // Get user from database based on role
            let user;
            if (decoded.role === 'admin') {
                const [rows] = await pool.query(
                    'SELECT * FROM admins WHERE id = ?',
                    [decoded.id]
                );
                user = rows[0];
            } else {
                const [rows] = await pool.query(
                    'SELECT * FROM users WHERE id = ?',
                    [decoded.id]
                );
                user = rows[0];
            }

            if (!user) {
                console.log('User not found in database');
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user is verified
            if (!user.isEmailVerified) {
                console.log('User email not verified');
                return res.status(401).json({
                    success: false,
                    message: 'Please verify your email first'
                });
            }

            // Check if user is approved (for regular users)
            if (decoded.role === 'user' && user.status !== 'approved') {
                console.log('User not approved');
                return res.status(401).json({
                    success: false,
                    message: 'Your account is pending approval'
                });
            }

            // Attach user to request
            req.user = user;
            if (user.role === 'admin') {
                req.admin = user;
            }
            req.token = token;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const isApproved = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. User only.' 
        });
    }
    if (req.user.status !== 'approved') {
        return res.status(403).json({ 
            success: false,
            message: 'Your account is pending approval' 
        });
    }
    next();
};

module.exports = {
    auth,
    isAdmin,
    isApproved,
    generateToken
}; 