const redis = require("redis");
const config = require("../config/index");

/**
 * @fileoverview Redis caching service for performance optimization
 * @module services/cacheService
 * @requires redis
 * @requires ../config/index
 */

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 10;
    this.isRedisOptional = process.env.REDIS_OPTIONAL === "true";
    this.isRedisRequired = config.redis?.required || false;

    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalResponseTime: 0,
      requestCount: 0,
      cacheHitRate: 0,
    };

    // Cache key generators
    this.keys = {
      user: (userId) => `user:${userId}`,
      userPlaylists: (userId) => `user:${userId}:playlists`,
      playlist: (playlistId) => `playlist:${playlistId}`,
      playlistSongs: (playlistId) => `playlist:${playlistId}:songs`,
      playlistCollaborators: (playlistId) =>
        `playlist:${playlistId}:collaborators`,
      publicPlaylists: (page = 1, limit = 20) =>
        `public:playlists:${page}:${limit}`,
      playlistSearch: (userId, query) =>
        `playlist:search:${userId}:${Buffer.from(query).toString("base64")}`,
      songSearch: (playlistId, query) =>
        `search:${playlistId}:${Buffer.from(query).toString("base64")}`,
      userAuth: (userId) => `auth:${userId}`,
      song: (songId) => `song:${songId}`,
      spotifyTrack: (trackId) => `spotify:track:${trackId}`,
      spotifySearch: (query, limit) =>
        `spotify:search:${Buffer.from(query).toString("base64")}:${limit}`,
      spotifyUserPlaylists: (userId) => `spotify:user:${userId}:playlists`,
      lastfmArtist: (artistName) =>
        `lastfm:artist:${Buffer.from(artistName).toString("base64")}`,
      // Genius API cache keys
      geniusSearch: (query, limit) =>
        `genius:search:${Buffer.from(query).toString("base64")}:${limit}`,
      geniusSong: (songId) => `genius:song:${songId}`,
      geniusArtist: (artistId) => `genius:artist:${artistId}`,
      geniusArtistSongs: (artistId, page, limit) =>
        `genius:artist:${artistId}:songs:${page}:${limit}`,
      geniusLyrics: (title, artist) =>
        `genius:lyrics:${Buffer.from(`${title}-${artist}`).toString("base64")}`,
      geniusTrending: (limit) => `genius:trending:${limit}`,
      // Real-time collaboration cache keys
      playlistSession: (playlistId) => `session:playlist:${playlistId}:users`,
      playlistMessages: (playlistId) => `messages:playlist:${playlistId}`,
      playlistCursors: (playlistId) => `session:playlist:${playlistId}:cursors`,
      nowPlaying: (playlistId) => `session:playlist:${playlistId}:nowplaying`,
      songVotes: (songId) => `votes:song:${songId}`,
      playlistNotifications: (playlistId) =>
        `notifications:playlist:${playlistId}`,
      userStatus: (userId) => `status:user:${userId}`,
      activeVotes: (playlistId) => `votes:playlist:${playlistId}:active`,
    };
  }

  /**
   * Initialize Redis connection
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // Check if Redis is required but not configured
      if (this.isRedisRequired && (!config.redis?.enabled || this.isRedisOptional)) {
        throw new Error("Redis is required but not properly configured. Set REDIS_REQUIRED=true and ensure Redis is available.");
      }

      // Skip Redis connection if disabled and not required
      if (!config.redis?.enabled || this.isRedisOptional) {
        console.log("⚠️  Redis disabled - running without cache");
        return;
      }

      this.client = redis.createClient({
        socket: {
          host: config.redis?.host || "localhost",
          port: config.redis?.port || 6379,
          reconnectStrategy: (retries) => {
            if (retries >= this.maxRetries) {
              const errorMsg = `❌ Redis max retries (${this.maxRetries}) reached.`;
              
              if (this.isRedisRequired) {
                console.error(errorMsg + " Application cannot continue without Redis.");
                process.exit(1); // Exit if Redis is required
              } else {
                console.log(errorMsg + " Disabling Redis.");
                return false; // Stop reconnecting if optional
              }
            }
            return Math.min(retries * 50, 500);
          },
        },
        password: config.redis?.password,
        database: config.redis?.db || 0,
      });

      this.client.on("connect", () => {
        console.log("🔗 Redis connecting...");
      });

      this.client.on("ready", () => {
        console.log("✅ Redis connected and ready");
        this.isConnected = true;
        this.retryAttempts = 0;
        
        // Update cache hit rate periodically
        this.updateMetrics();
      });

      this.client.on("error", (err) => {
        console.error("❌ Redis connection error:", err.message);
        this.isConnected = false;
        this.metrics.errors++;
        this.retryAttempts++;

        // If Redis is required, fail fast
        if (this.isRedisRequired) {
          console.error("🚨 Redis is required but connection failed. Application cannot continue.");
          process.exit(1);
        }

        // If too many errors and Redis is optional, disable it
        if (this.retryAttempts >= this.maxRetries) {
          console.log(
            "🔄 Disabling Redis due to persistent connection failures"
          );
          this.client = null;
        }
      });

      this.client.on("end", () => {
        console.log("⚠️  Redis connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        this.retryAttempts++;
        console.log(
          `🔄 Redis reconnecting... (attempt ${this.retryAttempts}/${this.maxRetries})`
        );
      });

      // Connect to Redis
      await this.client.connect();

      // Test connection
      await this.client.ping();
      console.log("✅ Redis connection test successful");
    } catch (error) {
      console.error("💥 Failed to connect to Redis:", error.message);
      console.log("🔄 App will continue without caching");
      this.isConnected = false;
      this.client = null;
      // Don't throw error - app should work without cache
    }
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached data or null
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        console.log(`📖 Cache HIT: ${key}`);
        this.metrics.hits++;
        return JSON.parse(data);
      }
      console.log(`📭 Cache MISS: ${key}`);
      this.metrics.misses++;
      return null;
    } catch (error) {
      console.error(`❌ Cache GET error for key "${key}":`, error.message);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Set cache data with TTL
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      this.metrics.sets++;
      return true;
    } catch (error) {
      console.error(`❌ Cache SET error for key "${key}":`, error.message);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      console.log(`🗑️  Cache DEL: ${key}`);
      this.metrics.deletes++;
      return result > 0;
    } catch (error) {
      console.error(`❌ Cache DEL error for key "${key}":`, error.message);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Invalidate cache keys matching pattern
   * @param {string} pattern - Pattern to match (e.g., 'user:*', 'playlist:123:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidate(pattern) {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(keys);
      console.log(`🧹 Cache INVALIDATE: ${pattern} (${result} keys deleted)`);
      this.metrics.deletes += result;
      return result;
    } catch (error) {
      console.error(
        `❌ Cache INVALIDATE error for pattern "${pattern}":`,
        error.message
      );
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Key existence status
   */
  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Cache EXISTS error for key "${key}":`, error.message);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Set cache with expiration timestamp
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {Date} expireAt - Expiration timestamp
   * @returns {Promise<boolean>} Success status
   */
  async setWithExpiry(key, value, expireAt) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const timestamp = Math.floor(expireAt.getTime() / 1000);
      await this.client.set(key, JSON.stringify(value), "EXPIREAT", timestamp);
      console.log(
        `💾 Cache SET with expiry: ${key} (expires: ${expireAt.toISOString()})`
      );
      this.metrics.sets++;
      return true;
    } catch (error) {
      console.error(
        `❌ Cache SET with expiry error for key "${key}":`,
        error.message
      );
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return { connected: false };
    }

    try {
      const info = await this.client.info("stats");
      const lines = info.split("\r\n");
      const stats = {};

      lines.forEach((line) => {
        if (line.includes(":")) {
          const [key, value] = line.split(":");
          stats[key] = isNaN(value) ? value : parseInt(value);
        }
      });

      return {
        connected: true,
        stats,
      };
    } catch (error) {
      console.error("❌ Cache STATS error:", error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Flush all cache data (USE WITH CAUTION)
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushdb();
      console.log("🧹 Cache FLUSHED");
      return true;
    } catch (error) {
      console.error("❌ Cache FLUSH error:", error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log("🔌 Redis connection closed");
      } catch (error) {
        console.error("❌ Error closing Redis connection:", error.message);
      }
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const avgResponseTime =
      this.metrics.requestCount > 0
        ? Math.round(
            (this.metrics.totalResponseTime / this.metrics.requestCount) * 100
          ) / 100
        : 0;

    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? Math.round(
            (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) *
              100
          )
        : 0;

    return {
      ...this.metrics,
      averageResponseTime: avgResponseTime,
      hitRate: `${hitRate}%`,
      connected: this.isConnected,
    };
  }

  /**
   * Update cache hit rate periodically
   */
  updateMetrics() {
    setInterval(() => {
      const totalRequests = this.metrics.hits + this.metrics.misses;
      this.metrics.cacheHitRate = totalRequests > 0 
        ? Math.round((this.metrics.hits / totalRequests) * 100) 
        : 0;
    }, 60000); // Update every minute
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalResponseTime: 0,
      requestCount: 0,
      cacheHitRate: 0,
    };
  }
}

module.exports = new CacheService();
