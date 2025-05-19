const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Format date to YYYY-MM-DD HH:MM:SS
 * @param {Date} date 
 * @returns {String} formatted date
 */
const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Calculate due date (default: 14 days from now)
 * @param {Number} days - Number of days to add
 * @returns {String} formatted due date
 */
const calculateDueDate = (days = 14) => {
  return formatDate(moment().add(days, 'days'));
};



/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @returns {Object} formatted response
 */
const successResponse = (res, message, data = null) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Error} error - Error object (optional)
 * @returns {Object} formatted response
 */
const errorResponse = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Hash password using bcrypt
 * @param {String} password - Plain text password
 * @returns {String} hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hashed password
 * @param {String} password - Plain text password
 * @param {String} hashedPassword - Hashed password
 * @returns {Boolean} password match result
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Validate Rwandan plate number format
 * @param {String} plateNumber - Plate number to validate
 * @returns {Boolean} validation result
 */
const isValidRwandanPlate = (plateNumber) => {
  const rwandanPlateRegex = /^R[A-Z]{2}\s\d{3}[A-Z]$/;
  return rwandanPlateRegex.test(plateNumber);
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} validation result
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random string
 * @param {Number} length - Length of random string
 * @returns {String} random string
 */
const generateRandomString = (length = 6) => {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase();
};

module.exports = {
  formatDate,
  calculateDueDate,
  errorResponse,
  successResponse,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  isValidRwandanPlate,
  isValidEmail,
  generateRandomString
};