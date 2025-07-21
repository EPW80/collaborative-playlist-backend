const geniusService = require("../services/geniusService");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const cacheService = require("../services/cacheService");

/**
 * @fileoverview Genius API controller for lyrics and song information
 * @module controllers/geniusController
 * @requires ../services/geniusService
 * @requires ../middleware/errorHandler
 * @requires ../services/cacheService
 */

/**
 * Search for songs on Genius
 * @route GET /api/lyrics/search
 * @access Public
 * @param {string} q - Search query (song title and artist)
 * @param {number} limit - Number of results to return (default: 10, max: 25)
 */
exports.searchSongs = asyncHandler(async (req, res) => {
  const { q: query, limit = 10 } = req.query;

  if (!query || query.trim().length === 0) {
    throw new AppError("Search query is required", 400);
  }

  // Validate limit
  const searchLimit = Math.min(parseInt(limit) || 10, 25);

  // Check cache first
  const cacheKey = cacheService.keys.geniusSearch(query, searchLimit);
  const cachedResults = await cacheService.get(cacheKey);

  if (cachedResults) {
    return res.json({
      success: true,
      message: "Song search results retrieved from cache",
      data: cachedResults,
      cached: true,
    });
  }

  // Search Genius API
  const results = await geniusService.searchSongs(query);

  if (!results.success) {
    throw new AppError(`Genius API error: ${results.error}`, 503);
  }

  // Limit results
  const limitedResults = {
    ...results,
    results: results.results.slice(0, searchLimit),
  };

  // Cache results for 1 hour
  await cacheService.set(cacheKey, limitedResults, 3600);

  res.json({
    success: true,
    message: `Found ${limitedResults.results.length} songs matching "${query}"`,
    data: limitedResults,
  });
});

/**
 * Get detailed song information including lyrics URL
 * @route GET /api/lyrics/song/:songId
 * @access Public
 * @param {number} songId - Genius song ID
 */
exports.getSongDetails = asyncHandler(async (req, res) => {
  const { songId } = req.params;

  if (!songId || isNaN(songId)) {
    throw new AppError("Valid song ID is required", 400);
  }

  // Check cache first
  const cacheKey = cacheService.keys.geniusSong(songId);
  const cachedSong = await cacheService.get(cacheKey);

  if (cachedSong) {
    return res.json({
      success: true,
      message: "Song details retrieved from cache",
      data: cachedSong,
      cached: true,
    });
  }

  // Get song details from Genius API
  const result = await geniusService.getSongDetails(parseInt(songId));

  if (!result.success) {
    throw new AppError(`Genius API error: ${result.error}`, 503);
  }

  if (!result.song) {
    throw new AppError("Song not found", 404);
  }

  // Cache song details for 24 hours
  await cacheService.set(cacheKey, result, 86400);

  res.json({
    success: true,
    message: "Song details retrieved successfully",
    data: result,
  });
});

/**
 * Get artist information
 * @route GET /api/lyrics/artist/:artistId
 * @access Public
 * @param {number} artistId - Genius artist ID
 */
exports.getArtistDetails = asyncHandler(async (req, res) => {
  const { artistId } = req.params;

  if (!artistId || isNaN(artistId)) {
    throw new AppError("Valid artist ID is required", 400);
  }

  // Check cache first
  const cacheKey = cacheService.keys.geniusArtist(artistId);
  const cachedArtist = await cacheService.get(cacheKey);

  if (cachedArtist) {
    return res.json({
      success: true,
      message: "Artist details retrieved from cache",
      data: cachedArtist,
      cached: true,
    });
  }

  // Get artist details from Genius API
  const result = await geniusService.getArtistDetails(parseInt(artistId));

  if (!result.success) {
    throw new AppError(`Genius API error: ${result.error}`, 503);
  }

  if (!result.artist) {
    throw new AppError("Artist not found", 404);
  }

  // Cache artist details for 24 hours
  await cacheService.set(cacheKey, result, 86400);

  res.json({
    success: true,
    message: "Artist details retrieved successfully",
    data: result,
  });
});

/**
 * Get artist's songs
 * @route GET /api/lyrics/artist/:artistId/songs
 * @access Public
 * @param {number} artistId - Genius artist ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Songs per page (default: 20, max: 50)
 */
exports.getArtistSongs = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!artistId || isNaN(artistId)) {
    throw new AppError("Valid artist ID is required", 400);
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(parseInt(limit) || 20, 50);

  // Check cache first
  const cacheKey = cacheService.keys.geniusArtistSongs(
    artistId,
    pageNum,
    limitNum
  );
  const cachedSongs = await cacheService.get(cacheKey);

  if (cachedSongs) {
    return res.json({
      success: true,
      message: "Artist songs retrieved from cache",
      data: cachedSongs,
      cached: true,
    });
  }

  // Get artist songs from Genius API
  const result = await geniusService.getArtistSongs(
    parseInt(artistId),
    pageNum,
    limitNum
  );

  if (!result.success) {
    throw new AppError(`Genius API error: ${result.error}`, 503);
  }

  // Cache artist songs for 2 hours
  await cacheService.set(cacheKey, result, 7200);

  res.json({
    success: true,
    message: `Retrieved ${result.songs.length} songs for artist`,
    data: result,
  });
});

/**
 * Find lyrics for a song by title and artist
 * @route GET /api/lyrics/find
 * @access Public
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 */
exports.findLyrics = asyncHandler(async (req, res) => {
  const { title, artist } = req.query;

  if (!title || !artist) {
    throw new AppError("Both title and artist are required", 400);
  }

  // Check cache first
  const cacheKey = cacheService.keys.geniusLyrics(title, artist);
  const cachedLyrics = await cacheService.get(cacheKey);

  if (cachedLyrics) {
    return res.json({
      success: true,
      message: "Lyrics information retrieved from cache",
      data: cachedLyrics,
      cached: true,
    });
  }

  // Find lyrics using Genius API
  const result = await geniusService.findSongLyrics(
    title.trim(),
    artist.trim()
  );

  if (!result.success) {
    return res.status(404).json({
      success: false,
      message: result.message || "Lyrics not found",
      data: null,
    });
  }

  // Cache lyrics for 24 hours
  await cacheService.set(cacheKey, result.data, 86400);

  res.json({
    success: true,
    message: result.message,
    data: result.data,
  });
});

/**
 * Get trending songs
 * @route GET /api/lyrics/trending
 * @access Public
 * @param {number} limit - Number of results to return (default: 20, max: 50)
 */
exports.getTrendingSongs = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const limitNum = Math.min(parseInt(limit) || 20, 50);

  // Check cache first
  const cacheKey = cacheService.keys.geniusTrending(limitNum);
  const cachedTrending = await cacheService.get(cacheKey);

  if (cachedTrending) {
    return res.json({
      success: true,
      message: "Trending songs retrieved from cache",
      data: cachedTrending,
      cached: true,
    });
  }

  // Get trending songs from Genius API
  const result = await geniusService.getTrendingSongs();

  if (!result.success) {
    throw new AppError(`Genius API error: ${result.error}`, 503);
  }

  // Limit results
  const limitedResults = {
    ...result,
    songs: result.songs.slice(0, limitNum),
  };

  // Cache trending songs for 30 minutes
  await cacheService.set(cacheKey, limitedResults, 1800);

  res.json({
    success: true,
    message: `Retrieved ${limitedResults.songs.length} trending songs`,
    data: limitedResults,
  });
});

/**
 * Health check for Genius API
 * @route GET /api/lyrics/health
 * @access Public
 */
exports.healthCheck = asyncHandler(async (req, res) => {
  const healthStatus = await geniusService.healthCheck();

  const statusCode = healthStatus.status === "healthy" ? 200 : 503;

  res.status(statusCode).json({
    success: healthStatus.status === "healthy",
    message: healthStatus.message,
    data: {
      service: "Genius API",
      status: healthStatus.status,
      configured: healthStatus.configured,
      responseTime: healthStatus.responseTime,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Add lyrics information to an existing song
 * @route POST /api/lyrics/enrich/:songId
 * @access Private
 * @param {string} songId - MongoDB song ID
 */
exports.enrichSongWithLyrics = asyncHandler(async (req, res) => {
  const { songId } = req.params;

  // Get the song from database
  const Song = require("../models/Song");
  const song = await Song.findById(songId);

  if (!song) {
    throw new AppError("Song not found", 404);
  }

  // Find lyrics using title and artist
  const lyricsResult = await geniusService.findSongLyrics(
    song.title,
    song.artist
  );

  if (!lyricsResult.success) {
    return res.status(404).json({
      success: false,
      message: "Lyrics not found for this song",
      data: null,
    });
  }

  // Update song with lyrics information
  const updatedSong = await Song.findByIdAndUpdate(
    songId,
    {
      $set: {
        "metadata.geniusId": lyricsResult.data.geniusId,
        "metadata.lyricsUrl": lyricsResult.data.lyricsUrl,
        "metadata.geniusImage": lyricsResult.data.fullImage,
      },
    },
    { new: true }
  )
    .populate("addedBy", "username")
    .populate("playlist", "name");

  // Invalidate related caches
  await cacheService.invalidate(`playlist:${song.playlist}:*`);
  await cacheService.invalidate(`song:${songId}*`);

  res.json({
    success: true,
    message: "Song enriched with lyrics information",
    data: {
      song: updatedSong,
      lyrics: lyricsResult.data,
    },
  });
});
