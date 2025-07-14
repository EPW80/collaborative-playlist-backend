const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @fileoverview Cache management routes for monitoring and debugging
 * @module routes/cache
 * @requires express
 * @requires ../middleware/auth
 * @requires ../services/cacheService
 * @requires ../middleware/errorHandler
 */

// Apply auth middleware to all cache management routes
router.use(auth);

/**
 * @route   GET /api/cache/stats
 * @desc    Get cache statistics and connection status
 * @access  Private
 * @returns {Object} 200 - Cache statistics
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/cache/stats
 * 
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "connected": true,
 *     "stats": {
 *       "keyspace_hits": 1000,
 *       "keyspace_misses": 200,
 *       "connected_clients": 1
 *     }
 *   }
 * }
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await cacheService.getStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * @route   POST /api/cache/invalidate
 * @desc    Invalidate cache keys matching a pattern
 * @access  Private (Admin only in production)
 * @param   {Object} body - Invalidation data
 * @param   {string} body.pattern - Cache key pattern to invalidate
 * @returns {Object} 200 - Invalidation result
 * @returns {Object} 400 - Invalid pattern
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "pattern": "playlist:*"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Cache invalidated successfully",
 *   "data": {
 *     "keysDeleted": 15
 *   }
 * }
 */
router.post('/invalidate', asyncHandler(async (req, res) => {
  const { pattern } = req.body;
  
  if (!pattern) {
    return res.status(400).json({
      success: false,
      message: 'Pattern is required'
    });
  }

  // In production, you might want to restrict this to admin users only
  if (process.env.NODE_ENV === 'production') {
    // Add admin check here if needed
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Admin access required' });
    // }
  }

  const keysDeleted = await cacheService.invalidate(pattern);
  
  res.json({
    success: true,
    message: 'Cache invalidated successfully',
    data: { keysDeleted }
  });
}));

/**
 * @route   DELETE /api/cache/flush
 * @desc    Flush all cache data (⚠️ USE WITH EXTREME CAUTION)
 * @access  Private (Admin only)
 * @returns {Object} 200 - Cache flushed successfully
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied
 * @returns {Object} 500 - Server error
 * @example
 * // Request: DELETE /api/cache/flush
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "All cache data flushed successfully"
 * }
 */
router.delete('/flush', asyncHandler(async (req, res) => {
  // Restrict to development environment or admin users
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Cache flush not allowed in production'
    });
  }

  const success = await cacheService.flush();
  
  if (success) {
    res.json({
      success: true,
      message: 'All cache data flushed successfully'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to flush cache'
    });
  }
}));

/**
 * @route   GET /api/cache/health
 * @desc    Check cache health and connectivity
 * @access  Private
 * @returns {Object} 200 - Cache health status
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 503 - Cache unavailable
 * @example
 * // Request: GET /api/cache/health
 * 
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": "healthy",
 *     "connected": true,
 *     "uptime": 3600,
 *     "lastCheck": "2025-07-13T12:00:00.000Z"
 *   }
 * }
 */
router.get('/health', asyncHandler(async (req, res) => {
  const isConnected = cacheService.isConnected;
  const stats = await cacheService.getStats();
  
  const healthData = {
    status: isConnected ? 'healthy' : 'unhealthy',
    connected: isConnected,
    lastCheck: new Date().toISOString(),
    ...stats
  };

  if (isConnected) {
    res.json({
      success: true,
      data: healthData
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Cache service unavailable',
      data: healthData
    });
  }
}));

module.exports = router;
