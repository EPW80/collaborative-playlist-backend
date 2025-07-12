const express = require('express');
const router = express.Router();

/**
 * @fileoverview Health check and API information routes
 * @module routes/health
 * @requires express
 */

/**
 * @route   GET /health
 * @desc    Health check endpoint to verify server status
 * @access  Public
 * @returns {Object} 200 - Server health status and information
 * @returns {Object} 500 - Server error (if unhealthy)
 * @example
 * // Request: GET /health
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Server is healthy",
 *   "data": {
 *     "status": "OK",
 *     "timestamp": "2025-07-11T12:00:00.000Z",
 *     "uptime": 3600.123,
 *     "environment": "development"
 *   }
 * }
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

/**
 * @route   GET /info
 * @desc    Get API information and available endpoints
 * @access  Public
 * @returns {Object} 200 - API information and endpoint list
 * @example
 * // Request: GET /info
 * 
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "name": "Collaborative Playlist Manager API",
 *     "version": "1.0.0",
 *     "description": "Backend API for collaborative music playlist management",
 *     "endpoints": {
 *       "auth": "/api/auth",
 *       "playlists": "/api/playlists",
 *       "songs": "/api/songs",
 *       "search": "/api/search"
 *     }
 *   }
 * }
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Collaborative Playlist Manager API',
      version: '1.0.0',
      description: 'Backend API for collaborative music playlist management',
      endpoints: {
        auth: '/api/auth',
        playlists: '/api/playlists',
        songs: '/api/songs',
        search: '/api/search'
      }
    }
  });
});

module.exports = router;
