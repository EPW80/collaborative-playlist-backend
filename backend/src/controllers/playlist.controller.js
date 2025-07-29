const Playlist = require("../models/Playlist");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const cacheService = require("../services/cacheService");
const rbacService = require("../services/rbacService");

// Get all playlists
exports.getPlaylists = asyncHandler(async (req, res, next) => {
  const cacheKey = cacheService.keys.userPlaylists(req.userId);

  // Try cache first
  const cachedPlaylists = await cacheService.get(cacheKey);
  if (cachedPlaylists) {
    return res.json({
      success: true,
      data: { playlists: cachedPlaylists },
      cached: true,
    });
  }

  // Get user's playlists and public playlists
  const playlists = await Playlist.find({
    $or: [
      { creator: req.userId },
      { "collaborators.user": req.userId },
      { isPublic: true },
    ],
  })
    .populate("creator", "username")
    .populate("collaborators.user", "username");

  // Cache the results for 15 minutes
  await cacheService.set(cacheKey, playlists, 900);

  res.json({
    success: true,
    data: { playlists },
  });
});

// Search playlists
exports.searchPlaylists = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return next(new AppError("Search query is required", 400));
  }

  const searchQuery = q.trim();
  const cacheKey = cacheService.keys.playlistSearch(req.userId, searchQuery);

  // Try cache first
  const cachedResults = await cacheService.get(cacheKey);
  if (cachedResults) {
    return res.json({
      success: true,
      data: { playlists: cachedResults },
      cached: true,
    });
  }

  // Search playlists by name or description
  const playlists = await Playlist.find({
    $and: [
      {
        $or: [
          { creator: req.userId },
          { "collaborators.user": req.userId },
          { isPublic: true },
        ],
      },
      {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
        ],
      },
    ],
  })
    .populate("creator", "username")
    .populate("collaborators.user", "username")
    .sort({ updatedAt: -1 });

  // Cache the results for 10 minutes
  await cacheService.set(cacheKey, playlists, 600);

  res.json({
    success: true,
    data: { playlists },
    query: searchQuery,
  });
});

// Create a new playlist
exports.createPlaylist = asyncHandler(async (req, res, next) => {
  const { name, description, isPublic } = req.body;

  if (!name || name.trim() === "") {
    return next(new AppError("Playlist name is required", 400));
  }

  const newPlaylist = new Playlist({
    name: name.trim(),
    description: description?.trim() || "",
    creator: req.userId,
    isPublic: isPublic || false,
    songs: [],
  });

  const playlist = await newPlaylist.save();

  // Populate the saved playlist with creator info
  const populatedPlaylist = await Playlist.findById(playlist._id)
    .populate("creator", "username")
    .populate("collaborators.user", "username");

  // Invalidate relevant caches
  await cacheService.invalidate(cacheService.keys.userPlaylists(req.userId));
  if (isPublic) {
    await cacheService.invalidate("public:playlists:*");
  }

  // Notify clients about the new playlist
  const io = req.app.get("io");
  if (io) {
    io.emit("playlist-created", populatedPlaylist);
  }

  console.log(
    `✅ New playlist created: ${playlist.name} by user ${req.userId}`
  );

  res.status(201).json({
    success: true,
    message: "Playlist created successfully",
    data: { playlist: populatedPlaylist },
  });
});

// Get a single playlist by ID
exports.getPlaylistById = asyncHandler(async (req, res, next) => {
  const playlistId = req.params.id;
  const userId = req.userId;

  // Use RBAC service for access validation
  const { playlist, userRole, permissions } = await rbacService.validateAccess(
    userId,
    playlistId
  );

  // Include RBAC information in response
  const playlistData = playlist.toObject();
  playlistData.userAccess = {
    role: userRole,
    permissions,
    canManage: rbacService.hasPermission(
      userId,
      playlist,
      "canManageCollaborators"
    ),
  };

  // Cache the playlist data
  const cacheKey = cacheService.keys.playlist(playlistId);
  await cacheService.set(cacheKey, playlistData, 300); // 5 minutes

  res.json({
    success: true,
    data: { playlist: playlistData },
  });
});

// Update a playlist
exports.updatePlaylist = asyncHandler(async (req, res, next) => {
  const { name, description, isPublic } = req.body;
  const playlistId = req.params.id;
  const userId = req.userId;

  // Use RBAC to validate permissions for managing settings
  const playlist = await rbacService.validatePermission(
    userId,
    playlistId,
    "canManageSettings"
  );

  if (name && name.trim() === "") {
    return next(new AppError("Playlist name cannot be empty", 400));
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name ? name.trim() : playlist.name,
      description:
        description !== undefined ? description.trim() : playlist.description,
      isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
      updatedAt: Date.now(),
    },
    { new: true, runValidators: true }
  )
    .populate("creator", "username")
    .populate("collaborators.user", "username");

  // Invalidate relevant caches
  await cacheService.invalidate(cacheService.keys.playlist(playlistId));
  await cacheService.invalidate(cacheService.keys.userPlaylists(userId));

  // If playlist was made public/private, invalidate public cache
  if (isPublic !== undefined) {
    await cacheService.invalidate("public:playlists:*");
  }

  // Notify clients about the playlist update
  const io = req.app.get("io");
  if (io) {
    io.to(`playlist-${req.params.id}`).emit(
      "playlist-updated",
      updatedPlaylist
    );
  }

  console.log(
    `✅ Playlist updated: ${updatedPlaylist.name} by user ${req.userId}`
  );

  res.json({
    success: true,
    message: "Playlist updated successfully",
    data: { playlist: updatedPlaylist },
  });
});

// Delete a playlist
exports.deletePlaylist = asyncHandler(async (req, res, next) => {
  const playlistId = req.params.id;
  const userId = req.userId;

  // Use RBAC to validate delete permissions (only owner can delete)
  const playlist = await rbacService.validatePermission(
    userId,
    playlistId,
    "canDelete"
  );

  // Delete all songs in the playlist first
  const Song = require("../models/Song");
  await Song.deleteMany({ playlist: playlistId });

  // Delete the playlist
  await Playlist.findByIdAndDelete(playlistId);

  // Notify clients about the deletion
  const io = req.app.get("io");
  if (io) {
    io.to(`playlist-${req.params.id}`).emit("playlist-deleted", req.params.id);
  }

  console.log(`✅ Playlist deleted: ${playlist.name} by user ${req.userId}`);

  res.json({
    success: true,
    message: "Playlist deleted successfully",
  });
});
