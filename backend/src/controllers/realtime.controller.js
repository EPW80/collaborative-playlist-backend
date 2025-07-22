const { asyncHandler, AppError } = require("../middleware/errorHandler");
const realtimeService = require("../services/realtimeService");
const cacheService = require("../services/cacheService");
const Song = require("../models/Song");
const Playlist = require("../models/Playlist");

/**
 * @fileoverview Real-time collaboration controller
 * @module controllers/realtimeController
 */

/**
 * Get current playlist session status
 * @route GET /api/realtime/session/:playlistId
 * @access Private
 */
exports.getSessionStatus = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.userId;

  // Validate playlist access
  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    playlistId
  );
  if (!hasAccess) {
    throw new AppError("Access denied to playlist", 403);
  }

  // Get current session state
  const sessionState = await realtimeService.getPlaylistCurrentState(
    playlistId
  );

  res.json({
    success: true,
    message: "Session status retrieved",
    data: sessionState,
  });
});

/**
 * Vote on a song
 * @route POST /api/realtime/vote
 * @access Private
 */
exports.voteSong = asyncHandler(async (req, res) => {
  const { songId, voteType, playlistId } = req.body;
  const userId = req.userId;

  if (!["upvote", "downvote"].includes(voteType)) {
    throw new AppError("Invalid vote type", 400);
  }

  // Validate song exists and user has access
  const song = await Song.findById(songId).populate("playlist");
  if (!song) {
    throw new AppError("Song not found", 404);
  }

  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    playlistId
  );
  if (!hasAccess) {
    throw new AppError("Access denied to playlist", 403);
  }

  // Remove any existing vote from this user
  song.userVotes = song.userVotes.filter(
    (vote) => vote.user.toString() !== userId
  );

  // Add new vote
  song.userVotes.push({
    user: userId,
    type: voteType,
    timestamp: new Date(),
  });

  // Recalculate vote totals
  const upvotes = song.userVotes.filter(
    (vote) => vote.type === "upvote"
  ).length;
  const downvotes = song.userVotes.filter(
    (vote) => vote.type === "downvote"
  ).length;

  song.votes = {
    upvotes,
    downvotes,
    total: upvotes - downvotes,
    lastVoteUpdate: new Date(),
  };

  await song.save();

  // Trigger real-time update through Socket.io
  const io = req.app.get("io");
  io.to(`playlist-${playlistId}`).emit("vote-updated", {
    songId,
    voteCount: song.votes,
    userId,
    voteType,
    timestamp: new Date(),
  });

  // Clear related cache
  await cacheService.del(cacheService.keys.song(songId));
  await cacheService.del(cacheService.keys.songVotes(songId));

  res.json({
    success: true,
    message: `Song ${voteType}d successfully`,
    data: {
      songId,
      votes: song.votes,
      userVote: voteType,
    },
  });
});

/**
 * Update now playing status
 * @route POST /api/realtime/now-playing
 * @access Private
 */
exports.updateNowPlaying = asyncHandler(async (req, res) => {
  const { playlistId, songId, action, position = 0 } = req.body;
  const userId = req.userId;

  if (!["play", "pause", "stop", "seek"].includes(action)) {
    throw new AppError("Invalid action", 400);
  }

  // Validate playlist access
  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    playlistId
  );
  if (!hasAccess) {
    throw new AppError("Access denied to playlist", 403);
  }

  // Validate song if provided
  if (songId) {
    const song = await Song.findById(songId);
    if (!song) {
      throw new AppError("Song not found", 404);
    }
  }

  // Update playlist now playing status
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new AppError("Playlist not found", 404);
  }

  playlist.nowPlaying = {
    songId: songId || null,
    userId,
    action,
    position,
    timestamp: new Date(),
  };

  playlist.activeSession.lastActivity = new Date();
  await playlist.save();

  // Trigger real-time update
  const io = req.app.get("io");
  io.to(`playlist-${playlistId}`).emit(
    "now-playing-updated",
    playlist.nowPlaying
  );

  // Update cache
  await cacheService.set(
    cacheService.keys.nowPlaying(playlistId),
    playlist.nowPlaying,
    1800 // 30 minutes
  );

  res.json({
    success: true,
    message: "Now playing status updated",
    data: playlist.nowPlaying,
  });
});

/**
 * Send real-time notification
 * @route POST /api/realtime/notification
 * @access Private
 */
exports.sendNotification = asyncHandler(async (req, res) => {
  const { playlistId, type, message, targetUsers } = req.body;
  const userId = req.userId;

  // Validate playlist access
  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    playlistId
  );
  if (!hasAccess) {
    throw new AppError("Access denied to playlist", 403);
  }

  const notification = {
    id: new Date().getTime(),
    type,
    message,
    userId,
    timestamp: new Date(),
    playlistId,
  };

  // Send notification via Socket.io
  const io = req.app.get("io");

  if (targetUsers && targetUsers.length > 0) {
    // Send to specific users
    targetUsers.forEach((targetUserId) => {
      io.to(`user-${targetUserId}`).emit("notification", notification);
    });
  } else {
    // Send to all users in playlist
    io.to(`playlist-${playlistId}`).emit("notification", notification);
  }

  // Cache notification
  const cacheKey = cacheService.keys.playlistNotifications(playlistId);
  const notifications = (await cacheService.get(cacheKey)) || [];
  notifications.unshift(notification);

  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50);
  }

  await cacheService.set(cacheKey, notifications, 3600);

  res.json({
    success: true,
    message: "Notification sent",
    data: notification,
  });
});

/**
 * Get song vote statistics
 * @route GET /api/realtime/votes/:songId
 * @access Private
 */
exports.getSongVotes = asyncHandler(async (req, res) => {
  const { songId } = req.params;
  const userId = req.userId;

  const song = await Song.findById(songId).populate("playlist");
  if (!song) {
    throw new AppError("Song not found", 404);
  }

  // Validate playlist access
  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    song.playlist._id
  );
  if (!hasAccess) {
    throw new AppError("Access denied", 403);
  }

  // Get user's vote if any
  const userVote = song.userVotes.find(
    (vote) => vote.user.toString() === userId
  );

  res.json({
    success: true,
    message: "Vote statistics retrieved",
    data: {
      songId,
      votes: song.votes,
      userVote: userVote ? userVote.type : null,
      totalVoters: song.userVotes.length,
    },
  });
});

/**
 * Get playlist activity feed
 * @route GET /api/realtime/activity/:playlistId
 * @access Private
 */
exports.getActivityFeed = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { limit = 20 } = req.query;
  const userId = req.userId;

  // Validate playlist access
  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    playlistId
  );
  if (!hasAccess) {
    throw new AppError("Access denied to playlist", 403);
  }

  // Get recent notifications/activities
  const notifications =
    (await cacheService.get(
      cacheService.keys.playlistNotifications(playlistId)
    )) || [];

  // Get current session info
  const sessionUsers = await realtimeService.getPlaylistSessionUsers(
    playlistId
  );
  const nowPlaying = await cacheService.get(
    cacheService.keys.nowPlaying(playlistId)
  );

  res.json({
    success: true,
    message: "Activity feed retrieved",
    data: {
      notifications: notifications.slice(0, parseInt(limit)),
      sessionUsers,
      nowPlaying,
      activeUsers: sessionUsers.length,
      timestamp: new Date(),
    },
  });
});

/**
 * Update user presence/cursor position
 * @route POST /api/realtime/presence
 * @access Private
 */
exports.updatePresence = asyncHandler(async (req, res) => {
  const { playlistId, cursorPosition, element, status = "active" } = req.body;
  const userId = req.userId;

  // Validate playlist access
  const hasAccess = await realtimeService.validatePlaylistAccess(
    userId,
    playlistId
  );
  if (!hasAccess) {
    throw new AppError("Access denied to playlist", 403);
  }

  // Update presence via Socket.io
  const io = req.app.get("io");
  io.to(`playlist-${playlistId}`).emit("presence-updated", {
    userId,
    cursorPosition,
    element,
    status,
    timestamp: new Date(),
  });

  // Cache presence data
  const cacheKey = cacheService.keys.playlistCursors(playlistId);
  const cursors = (await cacheService.get(cacheKey)) || {};
  cursors[userId] = { cursorPosition, element, status, timestamp: new Date() };
  await cacheService.set(cacheKey, cursors, 60); // 1 minute cache

  res.json({
    success: true,
    message: "Presence updated",
    data: {
      userId,
      cursorPosition,
      element,
      status,
    },
  });
});

/**
 * Get real-time statistics
 * @route GET /api/realtime/stats
 * @access Private (Admin only)
 */
exports.getRealtimeStats = asyncHandler(async (req, res) => {
  // Check if user is admin (implement your admin check)
  // const isAdmin = req.user.role === 'admin';
  // if (!isAdmin) {
  //   throw new AppError('Admin access required', 403);
  // }

  const stats = {
    connectedUsers: realtimeService.connectedUsers.size,
    activePlaylists: realtimeService.playlistSessions.size,
    nowPlayingPlaylists: realtimeService.nowPlayingStates.size,
    activeVotes: realtimeService.activeVotes.size,
    timestamp: new Date(),
  };

  res.json({
    success: true,
    message: "Real-time statistics retrieved",
    data: stats,
  });
});
