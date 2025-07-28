const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const cacheService = require("../services/cacheService");
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
 * @route   POST /api/auth/logout
 * @desc    Logout user and cleanup real-time sessions
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @returns {Object} 200 - Logout successful
 * @returns {Object} 401 - Unauthorized
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */
router.post("/logout", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Update user status to offline
    await cacheService.set(
      cacheService.keys.userStatus(userId),
      {
        status: "offline",
        lastActivity: new Date(),
        currentPlaylist: null,
      },
      3600
    );

    // Cleanup real-time sessions
    const realtimeService = req.app.get("realtimeService");
    if (realtimeService && realtimeService.connectedUsers.has(userId)) {
      const userData = realtimeService.connectedUsers.get(userId);
      if (userData && userData.playlistId) {
        // Remove from playlist session
        const playlistId = userData.playlistId;
        if (realtimeService.playlistSessions.has(playlistId)) {
          realtimeService.playlistSessions.get(playlistId).delete(userId);
        }

        // Notify other users
        const io = req.app.get("io");
        if (io) {
          io.to(`playlist-${playlistId}`).emit("user-logged-out", {
            userId,
            timestamp: new Date(),
          });
        }
      }

      // Remove from connected users
      realtimeService.connectedUsers.delete(userId);
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile with real-time status
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @returns {Object} 200 - User profile data with activity status
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
 *       "createdAt": "2025-07-11T12:00:00.000Z",
 *       "status": "active",
 *       "lastActivity": "2025-07-21T12:00:00.000Z",
 *       "activePlaylists": ["playlist_id_1", "playlist_id_2"]
 *     }
 *   }
 * }
 */
router.get("/me", auth, async (req, res, next) => {
  try {
    // Get user profile
    await getCurrentUser(req, res, next);

    // If response was successful, enhance with real-time data
    if (res.headersSent) return;

    const userId = req.userId;

    // Get user status from cache
    const userStatus = (await cacheService.get(
      cacheService.keys.userStatus(userId)
    )) || {
      status: "offline",
      lastActivity: new Date(),
      activePlaylists: [],
    };

    // Get original response data
    const originalResponse = res.json;
    res.json = function (data) {
      if (data.success && data.data && data.data.user) {
        data.data.user = {
          ...data.data.user,
          ...userStatus,
        };
      }
      return originalResponse.call(this, data);
    };
  } catch (error) {
    next(error);
  }
});

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

/**
 * @route   PUT /api/auth/status
 * @desc    Update user online status and activity
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @param   {Object} body - Status update data
 * @param   {string} body.status - User status ('active', 'idle', 'away', 'offline')
 * @param   {string} [body.currentPlaylist] - Currently active playlist ID
 * @returns {Object} 200 - Status updated successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @example
 * // Request body:
 * {
 *   "status": "active",
 *   "currentPlaylist": "playlist_id"
 * }
 *
 * // Response:
 * {
 *   "success": true,
 *   "message": "Status updated successfully",
 *   "data": {
 *     "status": "active",
 *     "lastActivity": "2025-07-21T12:00:00.000Z",
 *     "currentPlaylist": "playlist_id"
 *   }
 * }
 */
router.put(
  "/status",
  auth,
  [
    body("status")
      .isIn(["active", "idle", "away", "offline"])
      .withMessage("Status must be active, idle, away, or offline"),
    body("currentPlaylist")
      .optional()
      .isMongoId()
      .withMessage("Current playlist must be a valid ID"),
  ],
  async (req, res, next) => {
    try {
      const { status, currentPlaylist } = req.body;
      const userId = req.user.id;

      // Update user status in cache
      const userStatus = {
        status,
        lastActivity: new Date(),
        currentPlaylist: currentPlaylist || null,
        timestamp: new Date(),
      };

      await cacheService.set(
        cacheService.keys.userStatus(userId),
        userStatus,
        3600 // 1 hour
      );

      // Notify real-time service if available
      const realtimeService = req.app.get("realtimeService");
      if (realtimeService) {
        // Update user presence across all active playlists
        const io = req.app.get("io");
        if (io) {
          io.emit("user-status-updated", {
            userId,
            ...userStatus,
          });
        }
      }

      res.json({
        success: true,
        message: "Status updated successfully",
        data: userStatus,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/auth/activity
 * @desc    Get user's recent activity and session history
 * @access  Private
 * @headers {string} Authorization - Bearer JWT token
 * @param   {number} [limit] - Number of activities to return (default: 20)
 * @returns {Object} 200 - User activity data
 * @returns {Object} 401 - Unauthorized
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "currentStatus": "active",
 *     "activeSessions": [
 *       {
 *         "playlistId": "playlist_id",
 *         "playlistName": "My Playlist",
 *         "joinedAt": "2025-07-21T11:30:00.000Z",
 *         "lastActivity": "2025-07-21T12:00:00.000Z"
 *       }
 *     ],
 *     "recentActivities": [
 *       {
 *         "type": "song-added",
 *         "playlistId": "playlist_id",
 *         "timestamp": "2025-07-21T11:45:00.000Z",
 *         "details": { "songTitle": "Example Song" }
 *       }
 *     ]
 *   }
 * }
 */
router.get("/activity", auth, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const userId = req.user.id;

    // Get current user status
    const userStatus = (await cacheService.get(
      cacheService.keys.userStatus(userId)
    )) || {
      status: "offline",
      lastActivity: new Date(),
    };

    // Get active sessions (if real-time service is available)
    let activeSessions = [];
    const realtimeService = req.app.get("realtimeService");
    if (realtimeService && realtimeService.connectedUsers.has(userId)) {
      const userData = realtimeService.connectedUsers.get(userId);
      if (userData && userData.playlistId) {
        // Get playlist info for active session
        const Playlist = require("../models/Playlist");
        const playlist = await Playlist.findById(userData.playlistId).select(
          "name"
        );
        if (playlist) {
          activeSessions.push({
            playlistId: userData.playlistId,
            playlistName: playlist.name,
            joinedAt: userData.joinedAt,
            lastActivity:
              userData.status === "active" ? new Date() : userData.lastActivity,
          });
        }
      }
    }

    // Get recent activities from cache or database
    // This could be enhanced to track more detailed user activities
    const recentActivities = []; // Placeholder for actual activity tracking

    res.json({
      success: true,
      data: {
        currentStatus: userStatus.status,
        lastActivity: userStatus.lastActivity,
        activeSessions,
        recentActivities: recentActivities.slice(0, parseInt(limit)),
        totalSessions: activeSessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
