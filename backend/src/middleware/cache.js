const cacheService = require('../services/cacheService');

/**
 * @fileoverview Cache middleware for automatic response caching
 * @module middleware/cache
 * @requires ../services/cacheService
 */

/**
 * Cache middleware factory
 * @param {Object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds
 * @param {string} options.keyPrefix - Cache key prefix
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {Array} options.excludeMethods - HTTP methods to exclude from caching
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 3600, // 1 hour default
    keyPrefix = 'api',
    keyGenerator = null,
    excludeMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  } = options;

  return async (req, res, next) => {
    // Skip caching for excluded methods
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      const userId = req.user?.id || 'anonymous';
      const path = req.originalUrl || req.url;
      const query = JSON.stringify(req.query);
      cacheKey = `${keyPrefix}:${userId}:${Buffer.from(path + query).toString('base64')}`;
    }

    try {
      // Try to get cached response
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`⚡ Cache hit for ${req.method} ${req.originalUrl}`);
        return res.json(cachedData);
      }

      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            console.error('Cache set error:', err.message);
          });
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * @param {string|Array} patterns - Cache patterns to invalidate
 * @returns {Function} Express middleware
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    const invalidateCachePatterns = async () => {
      for (const pattern of patternsArray) {
        try {
          // Replace placeholders with actual values
          let resolvedPattern = pattern;
          if (req.user?.id) {
            resolvedPattern = resolvedPattern.replace(':userId', req.user.id);
          }
          if (req.params?.id) {
            resolvedPattern = resolvedPattern.replace(':id', req.params.id);
          }
          if (req.params?.playlistId) {
            resolvedPattern = resolvedPattern.replace(':playlistId', req.params.playlistId);
          }

          await cacheService.invalidate(resolvedPattern);
        } catch (error) {
          console.error('Cache invalidation error:', error.message);
        }
      }
    };

    // Override response methods to invalidate cache after successful operations
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCachePatterns();
      }
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCachePatterns();
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Predefined cache configurations for common use cases
 */
const cacheConfigs = {
  // User data - cache for 30 minutes
  user: {
    ttl: 1800,
    keyPrefix: 'user',
    keyGenerator: (req) => cacheService.keys.user(req.user?.id || req.params.id)
  },

  // Playlists - cache for 15 minutes
  playlist: {
    ttl: 900,
    keyPrefix: 'playlist',
    keyGenerator: (req) => {
      const playlistId = req.params.id || req.query.playlistId;
      return cacheService.keys.playlist(playlistId);
    }
  },

  // Public playlists - cache for 5 minutes
  publicPlaylists: {
    ttl: 300,
    keyPrefix: 'public',
    keyGenerator: (req) => {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      return cacheService.keys.publicPlaylists(page, limit);
    }
  },

  // Songs - cache for 10 minutes
  songs: {
    ttl: 600,
    keyPrefix: 'songs',
    keyGenerator: (req) => {
      const playlistId = req.query.playlistId || req.params.playlistId;
      return cacheService.keys.playlistSongs(playlistId);
    }
  },

  // External API data - cache for 1 hour
  external: {
    ttl: 3600,
    keyPrefix: 'external'
  }
};

/**
 * Cache invalidation patterns for different operations
 */
const invalidationPatterns = {
  // User operations
  user: ['user:*'],
  
  // Playlist operations
  playlist: [
    'playlist::id:*',
    'user::userId:playlists*',
    'public:playlists:*'
  ],
  
  // Song operations
  song: [
    'playlist::playlistId:*',
    'songs:*'
  ],
  
  // Collaboration operations
  collaboration: [
    'playlist::id:*',
    'user:*:playlists*'
  ]
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  cacheConfigs,
  invalidationPatterns
};
