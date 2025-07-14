const Playlist = require("../models/Playlist");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const cacheService = require("../services/cacheService");

// Get all playlists
exports.getPlaylists = asyncHandler(async (req, res, next) => {
  const cacheKey = cacheService.keys.userPlaylists(req.userId);
  
  // Try cache first
  const cachedPlaylists = await cacheService.get(cacheKey);
  if (cachedPlaylists) {
    return res.json({
      success: true,
      data: { playlists: cachedPlaylists },
      cached: true
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
    await cacheService.invalidate('public:playlists:*');
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
  const cacheKey = cacheService.keys.playlist(playlistId);
  
  // Try cache first
  const cachedPlaylist = await cacheService.get(cacheKey);
  if (cachedPlaylist) {
    // Still need to check access control even with cached data
    const isCreator = cachedPlaylist.creator._id.toString() === req.userId;
    const isCollaborator = cachedPlaylist.collaborators.some(
      (collab) => collab.user._id.toString() === req.userId
    );

    if (!cachedPlaylist.isPublic && !isCreator && !isCollaborator) {
      return next(new AppError("Access denied: This playlist is private", 403));
    }

    return res.json({
      success: true,
      data: { playlist: cachedPlaylist },
      cached: true
    });
  }

  const playlist = await Playlist.findById(playlistId)
    .populate("creator", "username")
    .populate("collaborators.user", "username")
    .populate({
      path: "songs",
      populate: {
        path: "addedBy",
        select: "username",
      },
      options: { sort: { order: 1, addedAt: 1 } },
    });

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Check if user has access to this playlist
  const isCreator = playlist.creator._id.toString() === req.userId;
  const isCollaborator = playlist.collaborators.some(
    (collab) => collab.user._id.toString() === req.userId
  );

  if (!playlist.isPublic && !isCreator && !isCollaborator) {
    return next(new AppError("Access denied: This playlist is private", 403));
  }

  // Cache the playlist for 10 minutes
  await cacheService.set(cacheKey, playlist, 600);

  res.json({
    success: true,
    data: { playlist },
  });
});

// Update a playlist
exports.updatePlaylist = asyncHandler(async (req, res, next) => {
  const { name, description, isPublic, collaborators } = req.body;

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Verify ownership
  if (playlist.creator.toString() !== req.userId) {
    return next(
      new AppError("Access denied: You can only update your own playlists", 403)
    );
  }

  if (name && name.trim() === "") {
    return next(new AppError("Playlist name cannot be empty", 400));
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    req.params.id,
    {
      name: name ? name.trim() : playlist.name,
      description:
        description !== undefined ? description.trim() : playlist.description,
      isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
      collaborators: collaborators || playlist.collaborators,
      updatedAt: Date.now(),
    },
    { new: true, runValidators: true }
  )
    .populate("creator", "username")
    .populate("collaborators", "username");

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
  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Verify ownership
  if (playlist.creator.toString() !== req.userId) {
    return next(
      new AppError("Access denied: You can only delete your own playlists", 403)
    );
  }

  // Delete all songs in the playlist first
  const Song = require("../models/Song");
  await Song.deleteMany({ playlist: req.params.id });

  // Delete the playlist
  await Playlist.findByIdAndDelete(req.params.id);

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
