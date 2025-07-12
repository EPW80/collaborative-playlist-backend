const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/auth.controller");

/**
 * @fileoverview Authentication and user management routes
 * @module routes/auth
 * @requires express
 * @requires express-validator
 * @requires ../middleware/auth
 * @requires ../controllers/auth.controller
 */

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @param   {Object} body - User registration data
 * @param   {string} body.username - Username (3-30 characters, required)
 * @param   {string} body.email - Valid email address (required)
 * @param   {string} body.password - Password (min 6 characters, required)
 * @returns {Object} 201 - User registered successfully with token
 * @returns {Object} 400 - Validation error
 * @returns {Object} 409 - Email or username already exists
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "token": "jwt_token_here",
 *     "user": {
 *       "id": "user_id",
 *       "username": "johndoe",
 *       "email": "john@example.com",
 *       "createdAt": "2025-07-11T12:00:00.000Z"
 *     }
 *   }
 * }
 */
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .trim()
      .withMessage("Username must be 3-30 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 * @param   {Object} body - Login credentials
 * @param   {string} body.email - User's email address (required)
 * @param   {string} body.password - User's password (required)
 * @returns {Object} 200 - Login successful with token
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "jwt_token_here",
 *     "user": {
 *       "id": "user_id",
 *       "username": "johndoe",
 *       "email": "john@example.com",
 *       "createdAt": "2025-07-11T12:00:00.000Z"
 *     }
 *   }
 * }
 */
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password").exists().withMessage("Password is required"),
  ],
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @returns {Object} 200 - User profile data
 * @returns {Object} 401 - Unauthorized or invalid token
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 * @example
 * // Headers:
 * // Authorization: Bearer jwt_token_here
 * 
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": "user_id",
 *       "username": "johndoe",
 *       "email": "john@example.com",
 *       "profilePicture": "profile_url",
 *       "createdAt": "2025-07-11T12:00:00.000Z"
 *     }
 *   }
 * }
 */
router.get("/me", auth, getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile information
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @param   {Object} body - Profile update data
 * @param   {string} [body.username] - New username (3-30 characters)
 * @param   {string} [body.profilePicture] - Profile picture URL
 * @returns {Object} 200 - Profile updated successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - User not found
 * @returns {Object} 409 - Username already taken
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "username": "newusername",
 *   "profilePicture": "https://example.com/profile.jpg"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Profile updated successfully",
 *   "data": {
 *     "user": {
 *       "id": "user_id",
 *       "username": "newusername",
 *       "email": "john@example.com",
 *       "profilePicture": "https://example.com/profile.jpg",
 *       "createdAt": "2025-07-11T12:00:00.000Z"
 *     }
 *   }
 * }
 */
router.put(
  "/profile",
  auth,
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .trim()
      .withMessage("Username must be 3-30 characters"),
    body("profilePicture")
      .optional()
      .isURL()
      .withMessage("Profile picture must be a valid URL"),
  ],
  updateProfile
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change user password
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @param   {Object} body - Password change data
 * @param   {string} body.currentPassword - Current password (required)
 * @param   {string} body.newPassword - New password (min 6 characters, required)
 * @returns {Object} 200 - Password changed successfully
 * @returns {Object} 400 - Validation error or incorrect current password
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "currentPassword": "oldPassword123",
 *   "newPassword": "newSecurePassword456"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 */
router.put(
  "/password",
  auth,
  [
    body("currentPassword")
      .exists()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  changePassword
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account and all associated data
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @param   {Object} body - Account deletion data
 * @param   {string} body.password - Current password for confirmation (required)
 * @returns {Object} 200 - Account deleted successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized or incorrect password
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 * @warning This action is irreversible and will delete all user data including playlists and songs
 * @example
 * // Request body:
 * {
 *   "password": "userPassword123"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 */
router.delete(
  "/account",
  auth,
  [
    body("password")
      .exists()
      .withMessage("Password is required for account deletion"),
  ],
  deleteAccount
);

module.exports = router;
