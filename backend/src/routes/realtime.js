const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const {
  getSessionStatus,
  voteSong,
  updateNowPlaying,
  sendNotification,
  getSongVotes,
  getActivityFeed,
  updatePresence,
  getRealtimeStats,
} = require("../controllers/realtime.controller");

/**
 * @fileoverview Real-time collaboration routes
 * @module routes/realtime
 * @requires express
 * @requires express-validator
 * @requires ../middleware/auth
 * @requires ../controllers/realtime.controller
 */

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   GET /api/realtime/session/:playlistId
 * @desc    Get current playlist session status
 * @access  Private
 * @returns {Object} 200 - Session status with active users, cursors, now playing
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Playlist not found
 */
router.get(
  "/session/:playlistId",
  [
    auth,
    param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    validateRequest,
  ],
  getSessionStatus
);

/**
 * @route   POST /api/realtime/vote
 * @desc    Vote on a song (upvote/downvote)
 * @access  Private
 * @param   {string} songId - Song ID to vote on
 * @param   {string} voteType - 'upvote' or 'downvote'
 * @param   {string} playlistId - Playlist ID for access validation
 * @returns {Object} 200 - Vote recorded successfully
 * @returns {Object} 400 - Invalid vote type or parameters
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Song not found
 */
router.post(
  "/vote",
  [
    auth,
    body("songId").isMongoId().withMessage("Invalid song ID"),
    body("voteType")
      .isIn(["upvote", "downvote"])
      .withMessage("Vote type must be upvote or downvote"),
    body("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    validateRequest,
  ],
  voteSong
);

/**
 * @route   POST /api/realtime/now-playing
 * @desc    Update now playing status for a playlist
 * @access  Private
 * @param   {string} playlistId - Playlist ID
 * @param   {string} songId - Song ID (optional for stop action)
 * @param   {string} action - 'play', 'pause', 'stop', or 'seek'
 * @param   {number} position - Playback position in seconds (optional)
 * @returns {Object} 200 - Now playing status updated
 * @returns {Object} 400 - Invalid action or parameters
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Playlist or song not found
 */
router.post(
  "/now-playing",
  [
    auth,
    body("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    body("songId").optional().isMongoId().withMessage("Invalid song ID"),
    body("action")
      .isIn(["play", "pause", "stop", "seek"])
      .withMessage("Action must be play, pause, stop, or seek"),
    body("position")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Position must be a non-negative integer"),
    validateRequest,
  ],
  updateNowPlaying
);

/**
 * @route   POST /api/realtime/notification
 * @desc    Send real-time notification to playlist users
 * @access  Private
 * @param   {string} playlistId - Playlist ID
 * @param   {string} type - Notification type
 * @param   {string} message - Notification message
 * @param   {string[]} targetUsers - Specific user IDs (optional)
 * @returns {Object} 200 - Notification sent successfully
 * @returns {Object} 400 - Invalid parameters
 * @returns {Object} 403 - Access denied
 */
router.post(
  "/notification",
  [
    auth,
    body("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    body("type").notEmpty().withMessage("Notification type is required"),
    body("message").notEmpty().withMessage("Notification message is required"),
    body("targetUsers")
      .optional()
      .isArray()
      .withMessage("Target users must be an array"),
    body("targetUsers.*")
      .optional()
      .isMongoId()
      .withMessage("Invalid user ID in target users"),
    validateRequest,
  ],
  sendNotification
);

/**
 * @route   GET /api/realtime/votes/:songId
 * @desc    Get vote statistics for a song
 * @access  Private
 * @param   {string} songId - Song ID
 * @returns {Object} 200 - Vote statistics
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Song not found
 */
router.get(
  "/votes/:songId",
  [
    auth,
    param("songId").isMongoId().withMessage("Invalid song ID"),
    validateRequest,
  ],
  getSongVotes
);

/**
 * @route   GET /api/realtime/activity/:playlistId
 * @desc    Get playlist activity feed
 * @access  Private
 * @param   {string} playlistId - Playlist ID
 * @param   {number} limit - Number of activities to return (optional, default: 20)
 * @returns {Object} 200 - Activity feed with notifications and session info
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Playlist not found
 */
router.get(
  "/activity/:playlistId",
  [
    auth,
    param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    validateRequest,
  ],
  getActivityFeed
);

/**
 * @route   POST /api/realtime/presence
 * @desc    Update user presence/cursor position
 * @access  Private
 * @param   {string} playlistId - Playlist ID
 * @param   {Object} cursorPosition - Cursor position data
 * @param   {string} element - Element being edited/focused
 * @param   {string} status - User status ('active', 'idle', 'away')
 * @returns {Object} 200 - Presence updated successfully
 * @returns {Object} 400 - Invalid parameters
 * @returns {Object} 403 - Access denied
 */
router.post(
  "/presence",
  [
    auth,
    body("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    body("status")
      .optional()
      .isIn(["active", "idle", "away"])
      .withMessage("Status must be active, idle, or away"),
    validateRequest,
  ],
  updatePresence
);

/**
 * @route   GET /api/realtime/stats
 * @desc    Get real-time system statistics
 * @access  Private (Admin only)
 * @returns {Object} 200 - Real-time statistics
 * @returns {Object} 403 - Admin access required
 */
router.get(
  "/stats",
  [
    auth,
    // Add admin middleware here if needed
  ],
  getRealtimeStats
);

module.exports = router;
