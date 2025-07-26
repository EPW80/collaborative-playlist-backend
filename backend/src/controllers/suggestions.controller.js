/**
 * @fileoverview Song Suggestions Controller for contributors
 * @module controllers/suggestionsController
 */

const { asyncHandler, AppError } = require("../middleware/errorHandler");
const rbacService = require("../services/rbacService");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

/**
 * Submit song suggestion (for contributors)
 * @route POST /api/suggestions/:playlistId
 * @access Private
 */
exports.submitSuggestion = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const {
    title,
    artist,
    album,
    duration,
    spotifyId,
    youtubeId,
    geniusId,
    previewUrl,
    imageUrl,
  } = req.body;
  const userId = req.userId;

  // Validate user can suggest songs
  const playlist = await rbacService.validatePermission(
    userId,
    playlistId,
    "canSuggest"
  );

  // Check if song already exists in playlist
  const existingSong = await Song.findOne({
    playlist: playlistId,
    title: new RegExp(`^${title}$`, "i"),
    artist: new RegExp(`^${artist}$`, "i"),
  });

  if (existingSong) {
    throw new AppError("Song already exists in playlist", 400);
  }

  // Check if suggestion already exists
  const existingSuggestion = playlist.pendingSuggestions.find(
    (suggestion) =>
      suggestion.song.title.toLowerCase() === title.toLowerCase() &&
      suggestion.song.artist.toLowerCase() === artist.toLowerCase() &&
      suggestion.status === "pending"
  );

  if (existingSuggestion) {
    throw new AppError("Song suggestion already pending", 400);
  }

  // Add suggestion
  const suggestion = {
    song: {
      title,
      artist,
      album,
      duration,
      spotifyId,
      youtubeId,
      geniusId,
      previewUrl,
      imageUrl,
    },
    suggestedBy: userId,
  };

  playlist.pendingSuggestions.push(suggestion);
  await playlist.save();

  // Get the added suggestion with populated user data
  const updatedPlaylist = await Playlist.findById(playlistId).populate(
    "pendingSuggestions.suggestedBy",
    "username email"
  );

  const addedSuggestion = updatedPlaylist.pendingSuggestions[
    updatedPlaylist.pendingSuggestions.length - 1
  ];

  res.json({
    success: true,
    message: "Song suggestion submitted successfully",
    data: {
      suggestion: addedSuggestion,
    },
  });
});

/**
 * Get pending suggestions for a playlist
 * @route GET /api/suggestions/:playlistId
 * @access Private
 */
exports.getPendingSuggestions = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { status = "pending" } = req.query;
  const userId = req.userId;

  // Validate user has access to playlist
  const { playlist } = await rbacService.validateAccess(userId, playlistId);

  // Filter suggestions by status
  const filteredSuggestions = playlist.pendingSuggestions.filter(
    (suggestion) => suggestion.status === status
  );

  // Populate user data
  await playlist.populate({
    path: "pendingSuggestions.suggestedBy pendingSuggestions.reviewedBy",
    select: "username email",
  });

  res.json({
    success: true,
    message: "Pending suggestions retrieved",
    data: {
      suggestions: filteredSuggestions,
      total: filteredSuggestions.length,
      canApprove: rbacService.hasPermission(userId, playlist, "canApprove"),
    },
  });
});

/**
 * Approve song suggestion
 * @route POST /api/suggestions/:playlistId/:suggestionId/approve
 * @access Private
 */
exports.approveSuggestion = asyncHandler(async (req, res) => {
  const { playlistId, suggestionId } = req.params;
  const { reviewNote } = req.body;
  const userId = req.userId;

  // Validate user can approve suggestions
  const playlist = await rbacService.validatePermission(
    userId,
    playlistId,
    "canApprove"
  );

  // Find suggestion
  const suggestion = playlist.pendingSuggestions.id(suggestionId);
  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  if (suggestion.status !== "pending") {
    throw new AppError("Suggestion has already been reviewed", 400);
  }

  // Create actual song from suggestion
  const newSong = new Song({
    title: suggestion.song.title,
    artist: suggestion.song.artist,
    album: suggestion.song.album,
    duration: suggestion.song.duration,
    playlist: playlistId,
    addedBy: suggestion.suggestedBy,
    spotifyId: suggestion.song.spotifyId,
    youtubeId: suggestion.song.youtubeId,
    geniusId: suggestion.song.geniusId,
    previewUrl: suggestion.song.previewUrl,
    imageUrl: suggestion.song.imageUrl,
  });

  await newSong.save();

  // Add song to playlist
  playlist.songs.push(newSong._id);

  // Update suggestion status
  suggestion.status = "approved";
  suggestion.reviewedBy = userId;
  suggestion.reviewedAt = new Date();
  suggestion.reviewNote = reviewNote;

  await playlist.save();

  res.json({
    success: true,
    message: "Suggestion approved and song added to playlist",
    data: {
      song: newSong,
      suggestion: suggestion,
    },
  });
});

/**
 * Reject song suggestion
 * @route POST /api/suggestions/:playlistId/:suggestionId/reject
 * @access Private
 */
exports.rejectSuggestion = asyncHandler(async (req, res) => {
  const { playlistId, suggestionId } = req.params;
  const { reviewNote } = req.body;
  const userId = req.userId;

  // Validate user can reject suggestions
  const playlist = await rbacService.validatePermission(
    userId,
    playlistId,
    "canReject"
  );

  // Find suggestion
  const suggestion = playlist.pendingSuggestions.id(suggestionId);
  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  if (suggestion.status !== "pending") {
    throw new AppError("Suggestion has already been reviewed", 400);
  }

  // Update suggestion status
  suggestion.status = "rejected";
  suggestion.reviewedBy = userId;
  suggestion.reviewedAt = new Date();
  suggestion.reviewNote = reviewNote || "Suggestion rejected";

  await playlist.save();

  res.json({
    success: true,
    message: "Suggestion rejected",
    data: {
      suggestion: suggestion,
    },
  });
});

/**
 * Delete suggestion (by suggester or admin+)
 * @route DELETE /api/suggestions/:playlistId/:suggestionId
 * @access Private
 */
exports.deleteSuggestion = asyncHandler(async (req, res) => {
  const { playlistId, suggestionId } = req.params;
  const userId = req.userId;

  const { playlist } = await rbacService.validateAccess(userId, playlistId);

  // Find suggestion
  const suggestion = playlist.pendingSuggestions.id(suggestionId);
  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  // Check if user can delete (own suggestion or has admin+ privileges)
  const isOwnSuggestion = suggestion.suggestedBy.toString() === userId;
  const canManage = rbacService.hasPermission(userId, playlist, "canApprove");

  if (!isOwnSuggestion && !canManage) {
    throw new AppError(
      "You can only delete your own suggestions or need admin privileges",
      403
    );
  }

  // Remove suggestion
  playlist.pendingSuggestions.pull(suggestionId);
  await playlist.save();

  res.json({
    success: true,
    message: "Suggestion deleted successfully",
    data: {
      deletedSuggestionId: suggestionId,
    },
  });
});

/**
 * Get user's own suggestions
 * @route GET /api/suggestions/my-suggestions/:playlistId
 * @access Private
 */
exports.getMySuggestions = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.userId;

  const { playlist } = await rbacService.validateAccess(userId, playlistId);

  // Filter user's own suggestions
  const userSuggestions = playlist.pendingSuggestions.filter(
    (suggestion) => suggestion.suggestedBy.toString() === userId
  );

  // Populate reviewer data
  await playlist.populate({
    path: "pendingSuggestions.reviewedBy",
    select: "username email",
  });

  res.json({
    success: true,
    message: "Your suggestions retrieved",
    data: {
      suggestions: userSuggestions,
      total: userSuggestions.length,
      summary: {
        pending: userSuggestions.filter((s) => s.status === "pending").length,
        approved: userSuggestions.filter((s) => s.status === "approved").length,
        rejected: userSuggestions.filter((s) => s.status === "rejected").length,
      },
    },
  });
});

module.exports = {
  submitSuggestion: exports.submitSuggestion,
  getPendingSuggestions: exports.getPendingSuggestions,
  approveSuggestion: exports.approveSuggestion,
  rejectSuggestion: exports.rejectSuggestion,
  deleteSuggestion: exports.deleteSuggestion,
  getMySuggestions: exports.getMySuggestions,
};
