const Playlist = require("../models/Playlist");
const Song = require("../models/Song");
const { AppError, asyncHandler } = require("../middleware/errorHandler");

// Get all songs from a playlist
exports.getSongs = asyncHandler(async (req, res, next) => {
  const { playlistId } = req.query;

  if (!playlistId) {
    return next(new AppError("Playlist ID is required", 400));
  }

  const playlist = await Playlist.findById(playlistId).populate({
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
  const isCreator = playlist.creator.toString() === req.userId;
  const isCollaborator = playlist.collaborators.some(
    (collab) => collab.user.toString() === req.userId
  );

  if (!playlist.isPublic && !isCreator && !isCollaborator) {
    return next(new AppError("Access denied: This playlist is private", 403));
  }

  res.json({
    success: true,
    data: { songs: playlist.songs },
  });
});

// Add a song to a playlist
exports.addSong = asyncHandler(async (req, res, next) => {
  const { playlistId, title, artist, album, duration, spotifyId, youtubeId } =
    req.body;

  if (!playlistId || !title || !artist || !duration) {
    return next(
      new AppError(
        "Playlist ID, song title, artist, and duration are required",
        400
      )
    );
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Check if user has permission to add songs
  const isCreator = playlist.creator.toString() === req.userId;
  const isCollaborator = playlist.collaborators.some(
    (collab) =>
      collab.user.toString() === req.userId &&
      (collab.role === "admin" || collab.role === "editor")
  );

  if (!isCreator && !isCollaborator) {
    return next(
      new AppError(
        "Access denied: Not authorized to add songs to this playlist",
        403
      )
    );
  }

  // Check for duplicates if not allowed
  if (!playlist.settings.allowDuplicates) {
    const existingSong = await Song.findOne({
      playlist: playlistId,
      title: title,
      artist: artist,
    });

    if (existingSong) {
      return next(new AppError("Song already exists in playlist", 400));
    }
  }

  // Get the next order number
  const lastSong = await Song.findOne({ playlist: playlistId }).sort({
    order: -1,
  });
  const nextOrder = lastSong ? lastSong.order + 1 : 0;

  const newSong = new Song({
    title: title.trim(),
    artist: artist.trim(),
    album: album?.trim() || "",
    duration,
    spotifyId,
    youtubeId,
    addedBy: req.userId,
    playlist: playlistId,
    order: nextOrder,
  });

  const savedSong = await newSong.save();

  // Add song reference to playlist
  playlist.songs.push(savedSong._id);
  playlist.updatedAt = Date.now();
  await playlist.save();

  // Populate the saved song with user info
  const populatedSong = await Song.findById(savedSong._id).populate(
    "addedBy",
    "username"
  );

  // Notify clients about the new song
  const io = req.app.get("io");
  if (io) {
    io.to(`playlist-${playlistId}`).emit("song-added", {
      playlistId,
      song: populatedSong,
    });
  }

  console.log(
    `✅ Song added to playlist: ${savedSong.title} by ${savedSong.artist}`
  );

  res.status(201).json({
    success: true,
    message: "Song added successfully",
    data: { song: populatedSong },
  });
});

// Remove a song from a playlist
exports.removeSong = asyncHandler(async (req, res, next) => {
  const { playlistId } = req.query;
  const songId = req.params.id;

  if (!playlistId) {
    return next(new AppError("Playlist ID is required", 400));
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Check if user has permission to remove songs
  const isCreator = playlist.creator.toString() === req.userId;
  const isCollaborator = playlist.collaborators.some(
    (collab) =>
      collab.user.toString() === req.userId &&
      (collab.role === "admin" || collab.role === "editor")
  );

  if (!isCreator && !isCollaborator) {
    return next(
      new AppError(
        "Access denied: Not authorized to remove songs from this playlist",
        403
      )
    );
  }

  // Find and remove the song
  const song = await Song.findOne({ _id: songId, playlist: playlistId });

  if (!song) {
    return next(new AppError("Song not found in playlist", 404));
  }

  // Remove song document
  await Song.findByIdAndDelete(songId);

  // Remove song reference from playlist
  playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);
  playlist.updatedAt = Date.now();
  await playlist.save();

  // Notify clients about the removed song
  const io = req.app.get("io");
  if (io) {
    io.to(`playlist-${playlistId}`).emit("song-removed", {
      playlistId,
      songId,
    });
  }

  console.log(`✅ Song removed from playlist: ${song.title} by ${song.artist}`);

  res.json({
    success: true,
    message: "Song removed successfully",
  });
});

// Search for songs in a playlist
exports.searchSongs = asyncHandler(async (req, res, next) => {
  const { playlistId, q } = req.query;

  if (!playlistId || !q) {
    return next(new AppError("Playlist ID and search query are required", 400));
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Check if user has access to this playlist
  const isCreator = playlist.creator.toString() === req.userId;
  const isCollaborator = playlist.collaborators.some(
    (collab) => collab.user.toString() === req.userId
  );

  if (!playlist.isPublic && !isCreator && !isCollaborator) {
    return next(new AppError("Access denied: This playlist is private", 403));
  }

  // Search for songs matching the query
  const searchQuery = q.toLowerCase().trim();
  const matchingSongs = await Song.find({
    playlist: playlistId,
    $or: [
      { title: { $regex: searchQuery, $options: "i" } },
      { artist: { $regex: searchQuery, $options: "i" } },
      { album: { $regex: searchQuery, $options: "i" } },
    ],
  })
    .populate("addedBy", "username")
    .sort({ order: 1, addedAt: 1 });

  res.json({
    success: true,
    data: { songs: matchingSongs },
  });
});

// Reorder songs in a playlist
exports.reorderSongs = asyncHandler(async (req, res, next) => {
  const { playlistId, songOrders } = req.body;

  if (!playlistId || !Array.isArray(songOrders)) {
    return next(
      new AppError("Playlist ID and song orders array are required", 400)
    );
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return next(new AppError("Playlist not found", 404));
  }

  // Check if user has permission to reorder songs
  const isCreator = playlist.creator.toString() === req.userId;
  const isCollaborator = playlist.collaborators.some(
    (collab) =>
      collab.user.toString() === req.userId &&
      (collab.role === "admin" || collab.role === "editor")
  );

  if (!isCreator && !isCollaborator) {
    return next(
      new AppError(
        "Access denied: Not authorized to reorder songs in this playlist",
        403
      )
    );
  }

  // Validate song orders
  if (
    songOrders.some((order) => !order.songId || typeof order.order !== "number")
  ) {
    return next(new AppError("Invalid song order format", 400));
  }

  // Update song orders
  const updatePromises = songOrders.map(({ songId, order }) =>
    Song.findByIdAndUpdate(songId, { order }, { new: true })
  );

  await Promise.all(updatePromises);

  // Notify clients about the reorder
  const io = req.app.get("io");
  if (io) {
    io.to(`playlist-${playlistId}`).emit("songs-reordered", {
      playlistId,
      songOrders,
    });
  }

  console.log(`✅ Songs reordered in playlist: ${playlistId}`);

  res.json({
    success: true,
    message: "Songs reordered successfully",
  });
});
