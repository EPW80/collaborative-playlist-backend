const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const {
  searchSongs,
  getSongDetails,
  getArtistDetails,
  getArtistSongs,
  findLyrics,
  getTrendingSongs,
  healthCheck,
  enrichSongWithLyrics,
} = require("../controllers/genius.controller");

/**
 * @fileoverview Genius API routes for lyrics and song information
 * @module routes/lyrics
 * @requires express
 * @requires express-validator
 * @requires ../middleware/auth
 * @requires ../controllers/genius.controller
 */

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   GET /api/lyrics/health
 * @desc    Check Genius API health status
 * @access  Public
 * @returns {Object} 200 - API health status
 * @returns {Object} 503 - API unavailable
 */
router.get("/health", healthCheck);

/**
 * @route   GET /api/lyrics/search
 * @desc    Search for songs on Genius
 * @access  Public
 * @param   {string} q - Search query (required)
 * @param   {number} limit - Number of results (optional, default: 10, max: 25)
 * @returns {Object} 200 - Search results
 * @returns {Object} 400 - Invalid query
 * @returns {Object} 503 - Genius API error
 * @example
 * // Request: GET /api/lyrics/search?q=bohemian rhapsody queen&limit=5
 *
 * // Response:
 * {
 *   "success": true,
 *   "message": "Found 5 songs matching 'bohemian rhapsody queen'",
 *   "data": {
 *     "success": true,
 *     "results": [
 *       {
 *         "id": 7687,
 *         "title": "Bohemian Rhapsody",
 *         "artist": "Queen",
 *         "url": "https://genius.com/Queen-bohemian-rhapsody-lyrics",
 *         "thumbnail": "...",
 *         "stats": { "hotness": 100, "pageViews": 1000000 }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  "/search",
  [
    query("q")
      .notEmpty()
      .withMessage("Search query is required")
      .isLength({ min: 1, max: 200 })
      .withMessage("Query must be between 1 and 200 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 25 })
      .withMessage("Limit must be between 1 and 25"),
    validateRequest,
  ],
  searchSongs
);

/**
 * @route   GET /api/lyrics/song/:songId
 * @desc    Get detailed song information from Genius
 * @access  Public
 * @param   {number} songId - Genius song ID (required)
 * @returns {Object} 200 - Song details
 * @returns {Object} 400 - Invalid song ID
 * @returns {Object} 404 - Song not found
 * @returns {Object} 503 - Genius API error
 */
router.get(
  "/song/:songId",
  [
    param("songId")
      .isInt({ min: 1 })
      .withMessage("Song ID must be a positive integer"),
    validateRequest,
  ],
  getSongDetails
);

/**
 * @route   GET /api/lyrics/artist/:artistId
 * @desc    Get artist information from Genius
 * @access  Public
 * @param   {number} artistId - Genius artist ID (required)
 * @returns {Object} 200 - Artist details
 * @returns {Object} 400 - Invalid artist ID
 * @returns {Object} 404 - Artist not found
 * @returns {Object} 503 - Genius API error
 */
router.get(
  "/artist/:artistId",
  [
    param("artistId")
      .isInt({ min: 1 })
      .withMessage("Artist ID must be a positive integer"),
    validateRequest,
  ],
  getArtistDetails
);

/**
 * @route   GET /api/lyrics/artist/:artistId/songs
 * @desc    Get songs by an artist from Genius
 * @access  Public
 * @param   {number} artistId - Genius artist ID (required)
 * @param   {number} page - Page number (optional, default: 1)
 * @param   {number} limit - Songs per page (optional, default: 20, max: 50)
 * @returns {Object} 200 - Artist's songs with pagination
 * @returns {Object} 400 - Invalid parameters
 * @returns {Object} 503 - Genius API error
 */
router.get(
  "/artist/:artistId/songs",
  [
    param("artistId")
      .isInt({ min: 1 })
      .withMessage("Artist ID must be a positive integer"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    validateRequest,
  ],
  getArtistSongs
);

/**
 * @route   GET /api/lyrics/find
 * @desc    Find lyrics for a song by title and artist
 * @access  Public
 * @param   {string} title - Song title (required)
 * @param   {string} artist - Artist name (required)
 * @returns {Object} 200 - Lyrics information with Genius URL
 * @returns {Object} 400 - Missing title or artist
 * @returns {Object} 404 - Lyrics not found
 * @returns {Object} 503 - Genius API error
 * @example
 * // Request: GET /api/lyrics/find?title=Bohemian Rhapsody&artist=Queen
 *
 * // Response:
 * {
 *   "success": true,
 *   "message": "Lyrics information found",
 *   "data": {
 *     "geniusId": 7687,
 *     "title": "Bohemian Rhapsody",
 *     "artist": "Queen",
 *     "lyricsUrl": "https://genius.com/Queen-bohemian-rhapsody-lyrics",
 *     "thumbnail": "...",
 *     "note": "Visit the URL to view full lyrics on Genius.com"
 *   }
 * }
 */
router.get(
  "/find",
  [
    query("title")
      .notEmpty()
      .withMessage("Song title is required")
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be between 1 and 200 characters"),
    query("artist")
      .notEmpty()
      .withMessage("Artist name is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Artist name must be between 1 and 100 characters"),
    validateRequest,
  ],
  findLyrics
);

/**
 * @route   GET /api/lyrics/trending
 * @desc    Get trending songs from Genius
 * @access  Public
 * @param   {number} limit - Number of results (optional, default: 20, max: 50)
 * @returns {Object} 200 - Trending songs
 * @returns {Object} 503 - Genius API error
 */
router.get(
  "/trending",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    validateRequest,
  ],
  getTrendingSongs
);

/**
 * @route   POST /api/lyrics/enrich/:songId
 * @desc    Add lyrics information to an existing song in database
 * @access  Private (requires authentication)
 * @param   {string} songId - MongoDB song ID (required)
 * @returns {Object} 200 - Song updated with lyrics info
 * @returns {Object} 400 - Invalid song ID
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - Song or lyrics not found
 * @returns {Object} 503 - Genius API error
 */
router.post(
  "/enrich/:songId",
  [
    auth,
    param("songId").isMongoId().withMessage("Invalid song ID format"),
    validateRequest,
  ],
  enrichSongWithLyrics
);

module.exports = router;
