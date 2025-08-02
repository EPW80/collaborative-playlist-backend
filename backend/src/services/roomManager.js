const cacheService = require("./cacheService");

/**
 * @fileoverview Efficient room management for real-time collaboration
 * @module services/roomManager
 */

class RoomManager {
  constructor(io, redisClients = null) {
    this.io = io;
    this.redisClients = redisClients;

    // Local caches for performance (with Redis backup)
    this.roomUsers = new Map(); // roomId -> Set of userIds
    this.userRooms = new Map(); // userId -> Set of roomIds
    this.userPresence = new Map(); // userId -> { status, lastSeen, metadata }

    // Setup presence tracking cleanup
    this.setupPresenceCleanup();
  }

  /**
   * Join a playlist room with efficient Redis-backed tracking
   * @param {Object} socket - Socket instance
   * @param {string} playlistId - Playlist ID
   * @param {string} userId - User ID
   */
  async joinPlaylistRoom(socket, playlistId, userId) {
    try {
      const room = `playlist:${playlistId}`;

      // Join Socket.io room
      await socket.join(room);

      // Update local cache
      if (!this.roomUsers.has(room)) {
        this.roomUsers.set(room, new Set());
      }
      this.roomUsers.get(room).add(userId);

      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId).add(room);

      // Track in Redis for persistence and scaling
      await this.trackUserInRoom(room, userId);

      // Update presence
      await this.updatePresence(userId, {
        status: "active",
        currentRoom: room,
        joinedAt: new Date(),
        socketId: socket.id,
      });

      // Get current room users
      const roomUsers = await this.getRoomUsers(room);

      // Emit user joined event
      socket.to(room).emit("user:joined", {
        userId,
        roomUsers: Array.from(roomUsers),
        timestamp: new Date(),
      });

      // Send current room state to joining user
      const roomState = await this.getRoomState(room);
      socket.emit("room:state", roomState);

      console.log(`👤 User ${userId} joined room ${room}`);
      return { success: true, roomUsers: Array.from(roomUsers) };
    } catch (error) {
      console.error(`❌ Error joining room ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Leave a playlist room
   * @param {Object} socket - Socket instance
   * @param {string} playlistId - Playlist ID
   * @param {string} userId - User ID
   */
  async leavePlaylistRoom(socket, playlistId, userId) {
    try {
      const room = `playlist:${playlistId}`;

      // Leave Socket.io room
      socket.leave(room);

      // Update local cache
      if (this.roomUsers.has(room)) {
        this.roomUsers.get(room).delete(userId);
        if (this.roomUsers.get(room).size === 0) {
          this.roomUsers.delete(room);
        }
      }

      if (this.userRooms.has(userId)) {
        this.userRooms.get(userId).delete(room);
        if (this.userRooms.get(userId).size === 0) {
          this.userRooms.delete(userId);
        }
      }

      // Remove from Redis
      await this.removeUserFromRoom(room, userId);

      // Update presence
      await this.updatePresence(userId, {
        status: "offline",
        currentRoom: null,
        leftAt: new Date(),
      });

      // Notify remaining users
      socket.to(room).emit("user:left", {
        userId,
        timestamp: new Date(),
      });

      console.log(`👤 User ${userId} left room ${room}`);
    } catch (error) {
      console.error(`❌ Error leaving room ${playlistId}:`, error);
    }
  }

  /**
   * Track user presence with Redis persistence
   * @param {string} userId - User ID
   * @param {Object} presenceData - Presence information
   */
  async updatePresence(userId, presenceData) {
    try {
      // Update local cache
      this.userPresence.set(userId, {
        ...presenceData,
        lastSeen: new Date(),
        timestamp: new Date(),
      });

      // Persist to Redis with TTL (30 seconds)
      const presenceKey = `presence:${userId}`;
      await cacheService.set(presenceKey, presenceData, 30);

      // Broadcast presence update to relevant rooms
      const userRooms = this.userRooms.get(userId) || new Set();
      for (const room of userRooms) {
        this.io.to(room).emit("presence:updated", {
          userId,
          presence: presenceData,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error(`❌ Error updating presence for ${userId}:`, error);
    }
  }

  /**
   * Track user in room using Redis
   * @private
   */
  async trackUserInRoom(room, userId) {
    try {
      // Use Redis Set to track room members
      const roomKey = `room:${room}:users`;
      await cacheService.redis?.sadd?.(roomKey, userId);
      await cacheService.redis?.expire?.(roomKey, 300); // 5 minutes TTL

      // Track user's rooms
      const userRoomsKey = `user:${userId}:rooms`;
      await cacheService.redis?.sadd?.(userRoomsKey, room);
      await cacheService.redis?.expire?.(userRoomsKey, 300);
    } catch (error) {
      console.error("Redis room tracking error:", error);
      // Continue without Redis if it fails
    }
  }

  /**
   * Remove user from room in Redis
   * @private
   */
  async removeUserFromRoom(room, userId) {
    try {
      const roomKey = `room:${room}:users`;
      await cacheService.redis?.srem?.(roomKey, userId);

      const userRoomsKey = `user:${userId}:rooms`;
      await cacheService.redis?.srem?.(userRoomsKey, room);
    } catch (error) {
      console.error("Redis room removal error:", error);
    }
  }

  /**
   * Get all users in a room
   * @param {string} room - Room identifier
   * @returns {Promise<Set>} Set of user IDs
   */
  async getRoomUsers(room) {
    try {
      // Try Redis first for accuracy across instances
      const roomKey = `room:${room}:users`;
      const redisUsers = await cacheService.redis?.smembers?.(roomKey);

      if (redisUsers && redisUsers.length > 0) {
        return new Set(redisUsers);
      }

      // Fallback to local cache
      return this.roomUsers.get(room) || new Set();
    } catch (error) {
      console.error("Error getting room users:", error);
      return this.roomUsers.get(room) || new Set();
    }
  }

  /**
   * Get current room state
   * @param {string} room - Room identifier
   * @returns {Promise<Object>} Room state information
   */
  async getRoomState(room) {
    try {
      const users = await this.getRoomUsers(room);
      const presenceData = {};

      // Get presence for all users in room
      for (const userId of users) {
        const presence =
          this.userPresence.get(userId) ||
          (await cacheService.get(`presence:${userId}`));
        if (presence) {
          presenceData[userId] = presence;
        }
      }

      return {
        room,
        userCount: users.size,
        users: Array.from(users),
        presence: presenceData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error getting room state:", error);
      return {
        room,
        userCount: 0,
        users: [],
        presence: {},
        timestamp: new Date(),
      };
    }
  }

  /**
   * Setup periodic cleanup of inactive users
   * @private
   */
  setupPresenceCleanup() {
    // Clean up inactive presence every 60 seconds
    setInterval(async () => {
      await this.cleanupInactiveUsers();
    }, 60000);
  }

  /**
   * Clean up users who haven't been seen recently
   * @private
   */
  async cleanupInactiveUsers() {
    try {
      const now = new Date();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [userId, presence] of this.userPresence.entries()) {
        const lastSeen = new Date(presence.lastSeen);

        if (now - lastSeen > inactiveThreshold) {
          console.log(`🧹 Cleaning up inactive user: ${userId}`);

          // Remove from all rooms
          const userRooms = this.userRooms.get(userId) || new Set();
          for (const room of userRooms) {
            await this.removeUserFromRoom(room, userId);

            // Notify room users
            this.io.to(room).emit("user:left", {
              userId,
              reason: "inactive",
              timestamp: new Date(),
            });
          }

          // Clean up local caches
          this.userPresence.delete(userId);
          this.userRooms.delete(userId);

          // Clean up Redis
          await cacheService.del(`presence:${userId}`);
        }
      }
    } catch (error) {
      console.error("Error during presence cleanup:", error);
    }
  }

  /**
   * Get real-time statistics
   * @returns {Object} Current statistics
   */
  getStats() {
    return {
      activeRooms: this.roomUsers.size,
      activeUsers: this.userPresence.size,
      totalConnections: Array.from(this.roomUsers.values()).reduce(
        (total, users) => total + users.size,
        0
      ),
      timestamp: new Date(),
    };
  }

  /**
   * Handle user disconnect
   * @param {Object} socket - Socket instance
   * @param {string} userId - User ID
   */
  async handleDisconnect(socket, userId) {
    try {
      if (!userId) return;

      // Get user's rooms
      const userRooms = this.userRooms.get(userId) || new Set();

      // Remove from all rooms
      for (const room of userRooms) {
        const roomId = room.replace("playlist:", "");
        await this.leavePlaylistRoom(socket, roomId, userId);
      }

      // Clean up user data
      this.userPresence.delete(userId);
      this.userRooms.delete(userId);

      console.log(`🔌 User ${userId} disconnected and cleaned up`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }
}

module.exports = RoomManager;
