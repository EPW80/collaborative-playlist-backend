const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { getSongs, addSong, removeSong, searchSongs, reorderSongs } = require('../controllers/song.controller');

/**
 * @fileoverview Song management routes for playlists
 * @module routes/songs
 * @requires express
 * @requires express-validator
 * @requires ../middleware/auth
 * @requires ../controllers/song.controller
 */

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply auth middleware to all song routes
router.use(auth);

/**
 * @route   GET /api/songs?playlistId=:id
 * @desc    Get all songs from a specific playlist
 * @access  Private (must have access to playlist)
 * @param   {string} playlistId - Playlist ID (MongoDB ObjectId, required)
 * @returns {Object} 200 - Array of songs in the playlist
 * @returns {Object} 400 - Invalid playlist ID
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (private playlist)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/songs?playlistId=playlist_id_here
 * 
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "songs": [
 *       {
 *         "_id": "song_id",
 *         "title": "Bohemian Rhapsody",
 *         "artist": "Queen",
 *         "album": "A Night at the Opera",
 *         "duration": 355,
 *         "addedBy": { "_id": "user_id", "username": "username" },
 *         "playlist": "playlist_id",
 *         "order": 0,
 *         "addedAt": "2025-07-11T12:00:00.000Z"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/', 
  [
    query('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    validateRequest
  ],
  getSongs
);

/**
 * @route   GET /api/songs/search?playlistId=:id&q=:query
 * @desc    Search for songs within a specific playlist
 * @access  Private (must have access to playlist)
 * @param   {string} playlistId - Playlist ID (MongoDB ObjectId, required)
 * @param   {string} q - Search query (min 1 character, required)
 * @returns {Object} 200 - Array of matching songs
 * @returns {Object} 400 - Invalid parameters
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (private playlist)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/songs/search?playlistId=playlist_id&q=queen
 * 
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "songs": [
 *       {
 *         "_id": "song_id",
 *         "title": "Bohemian Rhapsody",
 *         "artist": "Queen",
 *         "album": "A Night at the Opera",
 *         "duration": 355,
 *         "addedBy": { "_id": "user_id", "username": "username" },
 *         "order": 0
 *       }
 *     ]
 *   }
 * }
 */
router.get('/search', 
  [
    query('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    query('q').isLength({ min: 1 }).withMessage('Search query is required'),
    validateRequest
  ],
  searchSongs
);

/**
 * @route   POST /api/songs
 * @desc    Add a new song to a playlist
 * @access  Private (creator or collaborator with edit permissions)
 * @param   {Object} body - Song data
 * @param   {string} body.playlistId - Playlist ID (MongoDB ObjectId, required)
 * @param   {string} body.title - Song title (1-200 characters, required)
 * @param   {string} body.artist - Artist name (1-200 characters, required)
 * @param   {string} [body.album] - Album name (max 200 characters)
 * @param   {number} body.duration - Duration in seconds (positive integer, required)
 * @param   {string} [body.spotifyId] - Spotify track ID
 * @param   {string} [body.youtubeId] - YouTube video ID
 * @returns {Object} 201 - Song added successfully
 * @returns {Object} 400 - Validation error or duplicate song
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (insufficient permissions)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "playlistId": "playlist_id_here",
 *   "title": "Bohemian Rhapsody",
 *   "artist": "Queen",
 *   "album": "A Night at the Opera",
 *   "duration": 355,
 *   "spotifyId": "spotify_track_id"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Song added successfully",
 *   "data": {
 *     "song": {
 *       "_id": "new_song_id",
 *       "title": "Bohemian Rhapsody",
 *       "artist": "Queen",
 *       "album": "A Night at the Opera",
 *       "duration": 355,
 *       "addedBy": { "_id": "user_id", "username": "username" },
 *       "playlist": "playlist_id_here",
 *       "order": 0,
 *       "addedAt": "2025-07-11T12:00:00.000Z"
 *     }
 *   }
 * }
 */
router.post('/', 
  [
    body('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    body('title').isLength({ min: 1, max: 200 }).trim().withMessage('Song title must be 1-200 characters'),
    body('artist').isLength({ min: 1, max: 200 }).trim().withMessage('Artist name must be 1-200 characters'),
    body('album').optional().isLength({ max: 200 }).trim().withMessage('Album name must be less than 200 characters'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('spotifyId').optional().isString().withMessage('Spotify ID must be a string'),
    body('youtubeId').optional().isString().withMessage('YouTube ID must be a string'),
    validateRequest
  ],
  addSong
);

/**
 * @route   PUT /api/songs/reorder
 * @desc    Reorder songs within a playlist
 * @access  Private (creator or collaborator with edit permissions)
 * @param   {Object} body - Reorder data
 * @param   {string} body.playlistId - Playlist ID (MongoDB ObjectId, required)
 * @param   {Array} body.songOrders - Array of song order objects (required)
 * @param   {string} body.songOrders[].songId - Song ID (MongoDB ObjectId)
 * @param   {number} body.songOrders[].order - New order position (non-negative integer)
 * @returns {Object} 200 - Songs reordered successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (insufficient permissions)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "playlistId": "playlist_id_here",
 *   "songOrders": [
 *     { "songId": "song_id_1", "order": 1 },
 *     { "songId": "song_id_2", "order": 0 },
 *     { "songId": "song_id_3", "order": 2 }
 *   ]
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Songs reordered successfully"
 * }
 */
router.put('/reorder', 
  [
    body('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    body('songOrders').isArray().withMessage('Song orders must be an array'),
    body('songOrders.*.songId').isMongoId().withMessage('Each song ID must be valid'),
    body('songOrders.*.order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
    validateRequest
  ],
  reorderSongs
);

/**
 * @route   DELETE /api/songs/:id?playlistId=:playlistId
 * @desc    Remove a song from a playlist
 * @access  Private (creator or collaborator with edit permissions)
 * @param   {string} id - Song ID (MongoDB ObjectId, required)
 * @param   {string} playlistId - Playlist ID (MongoDB ObjectId, required)
 * @returns {Object} 200 - Song removed successfully
 * @returns {Object} 400 - Invalid IDs
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (insufficient permissions)
 * @returns {Object} 404 - Song or playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request: DELETE /api/songs/song_id_here?playlistId=playlist_id_here
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Song removed successfully"
 * }
 */
router.delete('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid song ID'),
    query('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    validateRequest
  ],
  removeSong
);

module.exports = router;
