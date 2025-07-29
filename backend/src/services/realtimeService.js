const mongoose = require("mongoose");
const cacheService = require("./cacheService");

/**
 * @fileoverview Real-time collaboration service for enhanced Socket.io features
 * @module services/realtimeService
 */

class RealtimeService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> { socketId, playlistId, cursorPosition, status }
    this.playlistSessions = new Map(); // playlistId -> Set of userIds
    this.nowPlayingStates = new Map(); // playlistId -> { songId, userId, timestamp, position }
    this.activeVotes = new Map(); // songId -> { upvotes: Set, downvotes: Set }
  }

  /**
   * Initialize real-time service with Socket.io server
   * @param {Object} io - Socket.io server instance
   */
  initialize(io) {
    this.io = io;

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Authentication middleware for socket
      socket.on("authenticate", async (data) => {
        try {
          const { userId, token } = data;
          // Verify JWT token here if needed
          socket.userId = userId;
          socket.emit("authenticated", { success: true });
        } catch (error) {
          socket.emit("authenticated", {
            success: false,
            error: error.message,
          });
        }
      });

      // Join playlist room
      socket.on("join-playlist", async (data) => {
        await this.handleJoinPlaylist(socket, data);
      });

      // Leave playlist room
      socket.on("leave-playlist", async (data) => {
        await this.handleLeavePlaylist(socket, data);
      });

      // Cursor position updates
      socket.on("cursor-update", async (data) => {
        await this.handleCursorUpdate(socket, data);
      });

      // Song voting
      socket.on("vote-song", async (data) => {
        await this.handleSongVote(socket, data);
      });

      // Now playing updates
      socket.on("now-playing-update", async (data) => {
        await this.handleNowPlayingUpdate(socket, data);
      });

      // Real-time notifications
      socket.on("send-notification", async (data) => {
        await this.handleNotification(socket, data);
      });

      // Live playlist editing
      socket.on("playlist-edit-start", async (data) => {
        await this.handlePlaylistEditStart(socket, data);
      });

      socket.on("playlist-edit-end", async (data) => {
        await this.handlePlaylistEditEnd(socket, data);
      });

      // Song reordering
      socket.on("song-reorder", async (data) => {
        await this.handleSongReorder(socket, data);
      });

      // Live chat in playlists
      socket.on("playlist-message", async (data) => {
        await this.handlePlaylistMessage(socket, data);
      });

      // Presence updates
      socket.on("user-presence", async (data) => {
        await this.handlePresenceUpdate(socket, data);
      });

      // Disconnect handling
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });

    // Set up database change streams for real-time updates
    this.setupDatabaseListeners();
    
    // Set up periodic cleanup
    this.setupPeriodicCleanup();
  }

  /**
   * Handle user joining a playlist
   */
  async handleJoinPlaylist(socket, data) {
    try {
      // Handle both old format (string) and new format (object)
      let playlistId, userId;
      
      if (typeof data === 'string') {
        // Old format: just playlistId string
        playlistId = data;
        userId = socket.userId; // Get from socket if available
      } else {
        // New format: object with playlistId and userId
        playlistId = data.playlistId;
        userId = data.userId || socket.userId;
      }

      if (!userId) {
        socket.emit("join-playlist-error", { message: "User not authenticated" });
        return;
      }

      if (!playlistId) {
        socket.emit("join-playlist-error", { message: "Playlist ID required" });
        return;
      }

      // Validate playlist access
      const hasAccess = await this.validatePlaylistAccess(userId, playlistId);
      if (!hasAccess) {
        socket.emit("join-playlist-error", { message: "Access denied" });
        return;
      }

      // Join playlist room
      socket.join(`playlist-${playlistId}`);
      socket.currentPlaylist = playlistId;

      // Update user session data
      this.connectedUsers.set(userId, {
        socketId: socket.id,
        playlistId,
        cursorPosition: null,
        status: "active",
        joinedAt: new Date(),
      });

      // Add to playlist session
      if (!this.playlistSessions.has(playlistId)) {
        this.playlistSessions.set(playlistId, new Set());
      }
      this.playlistSessions.get(playlistId).add(userId);

      // Get current session users
      const sessionUsers = await this.getPlaylistSessionUsers(playlistId);

      // Notify all users in playlist about new user
      socket.to(`playlist-${playlistId}`).emit("user-joined", {
        userId,
        sessionUsers,
        timestamp: new Date(),
      });

      // Send current state to joining user
      const currentState = await this.getPlaylistCurrentState(playlistId);
      socket.emit("playlist-state", currentState);

      // Cache session data
      await cacheService.set(
        cacheService.keys.playlistSession(playlistId),
        Array.from(this.playlistSessions.get(playlistId)),
        300 // 5 minutes
      );

      console.log(`User ${userId} joined playlist ${playlistId}`);
    } catch (error) {
      console.error("Error joining playlist:", error);
      socket.emit("join-playlist-error", {
        message: "Failed to join playlist",
      });
    }
  }

  /**
   * Handle user leaving a playlist
   */
  async handleLeavePlaylist(socket, data) {
    try {
      // Handle both old format (string) and new format (object)
      let playlistId, userId;
      
      if (typeof data === 'string') {
        // Old format: just playlistId string
        playlistId = data;
        userId = socket.userId; // Get from socket if available
      } else {
        // New format: object with playlistId and userId
        playlistId = data.playlistId;
        userId = data.userId || socket.userId;
      }

      if (!userId || !playlistId) {
        console.error("Missing userId or playlistId for leave playlist");
        return;
      }

      socket.leave(`playlist-${playlistId}`);

      // Remove from connected users
      this.connectedUsers.delete(userId);

      // Remove from playlist session
      if (this.playlistSessions.has(playlistId)) {
        this.playlistSessions.get(playlistId).delete(userId);

        // Clean up empty sessions
        if (this.playlistSessions.get(playlistId).size === 0) {
          this.playlistSessions.delete(playlistId);
          this.nowPlayingStates.delete(playlistId);
        }
      }

      // Notify remaining users
      socket.to(`playlist-${playlistId}`).emit("user-left", {
        userId,
        timestamp: new Date(),
      });

      console.log(`User ${userId} left playlist ${playlistId}`);

      // Update cache
      if (this.playlistSessions.has(playlistId)) {
        await cacheService.set(
          cacheService.keys.playlistSession(playlistId),
          Array.from(this.playlistSessions.get(playlistId)),
          300
        );
      } else {
        await cacheService.del(cacheService.keys.playlistSession(playlistId));
      }

      console.log(`User ${userId} left playlist ${playlistId}`);
    } catch (error) {
      console.error("Error leaving playlist:", error);
    }
  }

  /**
   * Handle cursor position updates
   */
  async handleCursorUpdate(socket, { playlistId, position, element }) {
    try {
      const userId = socket.userId;

      // Update cursor position
      if (this.connectedUsers.has(userId)) {
        const userData = this.connectedUsers.get(userId);
        userData.cursorPosition = { position, element, timestamp: new Date() };
        this.connectedUsers.set(userId, userData);
      }

      // Broadcast to other users in playlist
      socket.to(`playlist-${playlistId}`).emit("cursor-moved", {
        userId,
        position,
        element,
        timestamp: new Date(),
      });

      // Cache cursor positions for persistence
      const cacheKey = cacheService.keys.playlistCursors(playlistId);
      const cursors = (await cacheService.get(cacheKey)) || {};
      cursors[userId] = { position, element, timestamp: new Date() };
      await cacheService.set(cacheKey, cursors, 60); // 1 minute cache
    } catch (error) {
      console.error("Error updating cursor:", error);
    }
  }

  /**
   * Handle song voting (upvote/downvote)
   */
  async handleSongVote(socket, { songId, playlistId, voteType }) {
    try {
      const userId = socket.userId;

      if (!["upvote", "downvote"].includes(voteType)) {
        socket.emit("vote-error", { message: "Invalid vote type" });
        return;
      }

      // Initialize vote tracking for song
      if (!this.activeVotes.has(songId)) {
        this.activeVotes.set(songId, {
          upvotes: new Set(),
          downvotes: new Set(),
        });
      }

      const votes = this.activeVotes.get(songId);

      // Remove previous vote if exists
      votes.upvotes.delete(userId);
      votes.downvotes.delete(userId);

      // Add new vote
      if (voteType === "upvote") {
        votes.upvotes.add(userId);
      } else {
        votes.downvotes.add(userId);
      }

      // Calculate vote counts
      const voteCount = {
        upvotes: votes.upvotes.size,
        downvotes: votes.downvotes.size,
        total: votes.upvotes.size - votes.downvotes.size,
      };

      // Update database
      await this.updateSongVotes(songId, voteCount);

      // Broadcast vote update to all users in playlist
      this.io.to(`playlist-${playlistId}`).emit("vote-updated", {
        songId,
        voteCount,
        userId,
        voteType,
        timestamp: new Date(),
      });

      // Cache vote data
      await cacheService.set(
        cacheService.keys.songVotes(songId),
        {
          upvotes: Array.from(votes.upvotes),
          downvotes: Array.from(votes.downvotes),
          counts: voteCount,
        },
        3600 // 1 hour
      );

      console.log(`User ${userId} ${voteType}d song ${songId}`);
    } catch (error) {
      console.error("Error handling vote:", error);
      socket.emit("vote-error", { message: "Failed to process vote" });
    }
  }

  /**
   * Handle "Now Playing" status updates
   */
  async handleNowPlayingUpdate(
    socket,
    { playlistId, songId, action, position = 0 }
  ) {
    try {
      const userId = socket.userId;

      // Validate actions: play, pause, stop, seek
      if (!["play", "pause", "stop", "seek"].includes(action)) {
        socket.emit("now-playing-error", { message: "Invalid action" });
        return;
      }

      const nowPlayingData = {
        songId,
        userId,
        action,
        position,
        timestamp: new Date(),
      };

      // Update now playing state
      this.nowPlayingStates.set(playlistId, nowPlayingData);

      // Broadcast to all users in playlist
      this.io
        .to(`playlist-${playlistId}`)
        .emit("now-playing-updated", nowPlayingData);

      // Cache now playing state
      await cacheService.set(
        cacheService.keys.nowPlaying(playlistId),
        nowPlayingData,
        1800 // 30 minutes
      );

      // Update database with now playing status
      await this.updatePlaylistNowPlaying(playlistId, nowPlayingData);

      console.log(
        `Now playing updated for playlist ${playlistId}: ${action} ${songId}`
      );
    } catch (error) {
      console.error("Error updating now playing:", error);
      socket.emit("now-playing-error", {
        message: "Failed to update now playing",
      });
    }
  }

  /**
   * Handle real-time notifications
   */
  async handleNotification(
    socket,
    { playlistId, type, data, targetUsers = null }
  ) {
    try {
      const userId = socket.userId;

      const notification = {
        id: new mongoose.Types.ObjectId(),
        type, // 'song-added', 'song-removed', 'collaborator-added', etc.
        userId,
        data,
        timestamp: new Date(),
        playlistId,
      };

      // Determine recipients
      const recipients =
        targetUsers || this.getPlaylistSessionUsers(playlistId);

      // Send notification to specific users or entire playlist
      if (targetUsers) {
        targetUsers.forEach((targetUserId) => {
          const userData = this.connectedUsers.get(targetUserId);
          if (userData) {
            this.io.to(userData.socketId).emit("notification", notification);
          }
        });
      } else {
        socket.to(`playlist-${playlistId}`).emit("notification", notification);
      }

      // Cache recent notifications
      const cacheKey = cacheService.keys.playlistNotifications(playlistId);
      const recentNotifications = (await cacheService.get(cacheKey)) || [];
      recentNotifications.unshift(notification);

      // Keep only last 50 notifications
      if (recentNotifications.length > 50) {
        recentNotifications.splice(50);
      }

      await cacheService.set(cacheKey, recentNotifications, 3600); // 1 hour

      console.log(`Notification sent for playlist ${playlistId}: ${type}`);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  /**
   * Handle user disconnect
   */
  handleDisconnect(socket) {
    try {
      const userId = socket.userId;
      if (!userId) return;

      // Get user data before cleanup
      const userData = this.connectedUsers.get(userId);
      if (userData) {
        const { playlistId } = userData;

        // Remove from playlist session
        if (this.playlistSessions.has(playlistId)) {
          this.playlistSessions.get(playlistId).delete(userId);

          // Notify remaining users
          socket.to(`playlist-${playlistId}`).emit("user-disconnected", {
            userId,
            timestamp: new Date(),
          });
        }

        // Clean up user data
        this.connectedUsers.delete(userId);
      }

      console.log(`User ${userId} disconnected`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }

  /**
   * Set up database change streams for real-time updates
   */
  setupDatabaseListeners() {
    try {
      const Playlist = require("../models/Playlist");
      const Song = require("../models/Song");

      // Listen for playlist changes
      const playlistChangeStream = Playlist.watch();
      playlistChangeStream.on("change", (change) => {
        this.handlePlaylistChange(change);
      });

      // Listen for song changes
      const songChangeStream = Song.watch();
      songChangeStream.on("change", (change) => {
        this.handleSongChange(change);
      });

      console.log("Database change streams initialized");
    } catch (error) {
      console.error("Error setting up database listeners:", error);
    }
  }

  /**
   * Handle playlist database changes
   */
  async handlePlaylistChange(change) {
    try {
      const { operationType, documentKey, fullDocument } = change;

      if (!documentKey || !documentKey._id) return;

      const playlistId = documentKey._id.toString();

      // Notify users in the playlist room
      this.io.to(`playlist-${playlistId}`).emit("playlist-updated", {
        operationType,
        playlistId,
        data: fullDocument,
        timestamp: new Date(),
      });

      // Clear related cache
      await cacheService.del(cacheService.keys.playlist(playlistId));
    } catch (error) {
      console.error("Error handling playlist change:", error);
    }
  }

  /**
   * Handle song database changes
   */
  async handleSongChange(change) {
    try {
      const { operationType, documentKey, fullDocument } = change;

      if (!documentKey || !documentKey._id) return;

      const songId = documentKey._id.toString();

      // Find playlists containing this song
      const playlists = await this.getPlaylistsContainingSong(songId);

      // Notify all relevant playlist rooms
      playlists.forEach((playlistId) => {
        this.io.to(`playlist-${playlistId}`).emit("song-updated", {
          operationType,
          songId,
          playlistId,
          data: fullDocument,
          timestamp: new Date(),
        });
      });

      // Clear related cache
      await cacheService.del(cacheService.keys.song(songId));
    } catch (error) {
      console.error("Error handling song change:", error);
    }
  }

  /**
   * Helper methods
   */
  async validatePlaylistAccess(userId, playlistId) {
    // Use RBAC service for more comprehensive access validation
    try {
      const rbacService = require("./rbacService");
      const { playlist } = await rbacService.validateAccess(userId, playlistId);
      return !!playlist;
    } catch (error) {
      console.error("Error validating playlist access:", error);
      return false;
    }
  }

  async getPlaylistSessionUsers(playlistId) {
    const session = this.playlistSessions.get(playlistId);
    return session ? Array.from(session) : [];
  }

  async getPlaylistCurrentState(playlistId) {
    try {
      // Get playlist data, current sessions, now playing, etc.
      const sessionUsers = await this.getPlaylistSessionUsers(playlistId);
      const nowPlaying = this.nowPlayingStates.get(playlistId);
      const cursors =
        (await cacheService.get(
          cacheService.keys.playlistCursors(playlistId)
        )) || {};
      const notifications =
        (await cacheService.get(
          cacheService.keys.playlistNotifications(playlistId)
        )) || [];

      return {
        sessionUsers,
        nowPlaying,
        cursors,
        recentNotifications: notifications.slice(0, 10), // Last 10 notifications
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error getting playlist state:", error);
      return {};
    }
  }

  async updateSongVotes(songId, voteCount) {
    try {
      const Song = require("../models/Song");
      await Song.findByIdAndUpdate(songId, {
        votes: voteCount,
        lastVoteUpdate: new Date(),
      });
    } catch (error) {
      console.error("Error updating song votes:", error);
    }
  }

  async updatePlaylistNowPlaying(playlistId, nowPlayingData) {
    try {
      const Playlist = require("../models/Playlist");
      await Playlist.findByIdAndUpdate(playlistId, {
        nowPlaying: nowPlayingData,
        lastActivity: new Date(),
      });
    } catch (error) {
      console.error("Error updating playlist now playing:", error);
    }
  }

  async getPlaylistsContainingSong(songId) {
    try {
      const Playlist = require("../models/Playlist");
      const playlists = await Playlist.find({ songs: songId }).select("_id");
      return playlists.map((p) => p._id.toString());
    } catch (error) {
      console.error("Error finding playlists containing song:", error);
      return [];
    }
  }

  // Public API methods for controllers to trigger real-time updates
  notifyPlaylistUpdate(playlistId, updateType, data) {
    this.io.to(`playlist-${playlistId}`).emit("playlist-updated", {
      type: updateType,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Handle live playlist editing sessions
   */
  async handlePlaylistEditStart(socket, { playlistId, field }) {
    try {
      const userId = socket.userId;
      if (!userId) return;

      const hasAccess = await this.validatePlaylistAccess(userId, playlistId);
      if (!hasAccess) {
        socket.emit("edit-error", { message: "Access denied" });
        return;
      }

      // Track who's editing what
      const editKey = `${playlistId}-${field}`;
      
      socket.to(`playlist-${playlistId}`).emit("user-editing", {
        userId,
        field,
        editing: true,
        timestamp: new Date(),
      });

      socket.editingField = editKey;
    } catch (error) {
      console.error("Error handling edit start:", error);
    }
  }

  async handlePlaylistEditEnd(socket, { playlistId, field }) {
    try {
      const userId = socket.userId;
      if (!userId) return;

      socket.to(`playlist-${playlistId}`).emit("user-editing", {
        userId,
        field,
        editing: false,
        timestamp: new Date(),
      });

      socket.editingField = null;
    } catch (error) {
      console.error("Error handling edit end:", error);
    }
  }

  /**
   * Handle real-time song reordering
   */
  async handleSongReorder(socket, { playlistId, oldIndex, newIndex, songId }) {
    try {
      const userId = socket.userId;
      if (!userId) return;

      const hasAccess = await this.validatePlaylistAccess(userId, playlistId);
      if (!hasAccess) {
        socket.emit("reorder-error", { message: "Access denied" });
        return;
      }

      // Broadcast reorder to all users in playlist
      socket.to(`playlist-${playlistId}`).emit("song-reordered", {
        userId,
        songId,
        oldIndex,
        newIndex,
        timestamp: new Date(),
      });

      // Log activity
      console.log(`User ${userId} reordered song ${songId} in playlist ${playlistId}`);
    } catch (error) {
      console.error("Error handling song reorder:", error);
    }
  }

  /**
   * Handle playlist chat messages
   */
  async handlePlaylistMessage(socket, { playlistId, message, type = "chat" }) {
    try {
      const userId = socket.userId;
      if (!userId) return;

      const hasAccess = await this.validatePlaylistAccess(userId, playlistId);
      if (!hasAccess) {
        socket.emit("message-error", { message: "Access denied" });
        return;
      }

      const messageData = {
        id: Date.now().toString(),
        userId,
        message: message.trim(),
        type,
        timestamp: new Date(),
      };

      // Broadcast message to all users in playlist
      this.io.to(`playlist-${playlistId}`).emit("playlist-message", messageData);

      // Cache recent messages
      const cacheKey = cacheService.keys.playlistMessages(playlistId);
      let messages = await cacheService.get(cacheKey) || [];
      messages.push(messageData);
      
      // Keep only last 50 messages
      if (messages.length > 50) {
        messages = messages.slice(-50);
      }
      
      await cacheService.set(cacheKey, messages, 3600); // 1 hour

    } catch (error) {
      console.error("Error handling playlist message:", error);
    }
  }

  /**
   * Handle user presence updates
   */
  async handlePresenceUpdate(socket, { playlistId, presence }) {
    try {
      const userId = socket.userId;
      if (!userId) return;

      // Update user presence in session
      if (this.connectedUsers.has(userId)) {
        const userData = this.connectedUsers.get(userId);
        userData.presence = presence;
        userData.lastSeen = new Date();
        this.connectedUsers.set(userId, userData);
      }

      // Broadcast presence to playlist
      socket.to(`playlist-${playlistId}`).emit("user-presence", {
        userId,
        presence,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error("Error handling presence update:", error);
    }
  }

  /**
   * Set up periodic cleanup
   */
  setupPeriodicCleanup() {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 300000);

    // Update session stats every minute
    setInterval(() => {
      this.updateSessionStats();
    }, 60000);
  }

  cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [userId, userData] of this.connectedUsers.entries()) {
      if (now - userData.lastSeen > inactiveThreshold) {
        console.log(`Cleaning up inactive session for user ${userId}`);
        this.connectedUsers.delete(userId);
        
        // Remove from playlist sessions
        if (userData.playlistId && this.playlistSessions.has(userData.playlistId)) {
          this.playlistSessions.get(userData.playlistId).delete(userId);
        }
      }
    }
  }

  updateSessionStats() {
    const stats = {
      connectedUsers: this.connectedUsers.size,
      activePlaylists: this.playlistSessions.size,
      timestamp: new Date(),
    };

    // Emit to admin dashboard if needed
    this.io.emit("session-stats", stats);
  }

  notifySongAdded(playlistId, song, addedBy) {
    this.io.to(`playlist-${playlistId}`).emit("song-added", {
      song,
      addedBy,
      timestamp: new Date(),
    });
  }

  notifySongRemoved(playlistId, songId, removedBy) {
    this.io.to(`playlist-${playlistId}`).emit("song-removed", {
      songId,
      removedBy,
      timestamp: new Date(),
    });
  }

  notifyCollaboratorAdded(playlistId, collaborator, addedBy) {
    this.io.to(`playlist-${playlistId}`).emit("collaborator-added", {
      collaborator,
      addedBy,
      timestamp: new Date(),
    });
  }
}

module.exports = new RealtimeService();
