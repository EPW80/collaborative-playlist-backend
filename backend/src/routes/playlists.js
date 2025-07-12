const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { getPlaylists, createPlaylist, getPlaylistById, updatePlaylist, deletePlaylist } = require('../controllers/playlist.controller');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

/**
 * @fileoverview Playlist management routes
 * @module routes/playlists
 * @requires express
 * @requires express-validator
 * @requires ../middleware/auth
 * @requires ../controllers/playlist.controller
 */

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply auth middleware to all playlist routes
router.use(auth);

/**
 * @route   GET /api/playlists
 * @desc    Get all playlists (user's own, collaborative, and public)
 * @access  Private
 * @returns {Object} 200 - Array of playlist objects
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Response format:
 * {
 *   "success": true,
 *   "data": {
 *     "playlists": [
 *       {
 *         "_id": "playlist_id",
 *         "name": "My Playlist",
 *         "description": "Description",
 *         "creator": { "_id": "user_id", "username": "username" },
 *         "isPublic": true,
 *         "songs": [],
 *         "collaborators": [],
 *         "createdAt": "2025-07-11T12:00:00.000Z",
 *         "updatedAt": "2025-07-11T12:00:00.000Z"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/', getPlaylists);

/**
 * @route   POST /api/playlists
 * @desc    Create a new playlist
 * @access  Private
 * @param   {Object} body - Playlist data
 * @param   {string} body.name - Playlist name (1-100 characters, required)
 * @param   {string} [body.description] - Playlist description (max 500 characters)
 * @param   {boolean} [body.isPublic=false] - Whether playlist is public
 * @returns {Object} 201 - Created playlist object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "name": "My New Playlist",
 *   "description": "A collection of my favorite songs",
 *   "isPublic": true
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Playlist created successfully",
 *   "data": {
 *     "playlist": {
 *       "_id": "new_playlist_id",
 *       "name": "My New Playlist",
 *       "description": "A collection of my favorite songs",
 *       "creator": "user_id",
 *       "isPublic": true,
 *       "songs": [],
 *       "collaborators": []
 *     }
 *   }
 * }
 */
router.post('/', 
  [
    body('name').isLength({ min: 1, max: 100 }).trim().withMessage('Name must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).trim().withMessage('Description must be less than 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    validateRequest
  ],
  createPlaylist
);

/**
 * @route   GET /api/playlists/:id
 * @desc    Get a specific playlist by ID with songs
 * @access  Private (must have access to playlist)
 * @param   {string} id - Playlist ID (MongoDB ObjectId)
 * @returns {Object} 200 - Playlist object with populated songs
 * @returns {Object} 400 - Invalid playlist ID
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (private playlist)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "playlist": {
 *       "_id": "playlist_id",
 *       "name": "My Playlist",
 *       "creator": { "_id": "user_id", "username": "username" },
 *       "songs": [
 *         {
 *           "_id": "song_id",
 *           "title": "Song Title",
 *           "artist": "Artist Name",
 *           "addedBy": { "_id": "user_id", "username": "username" },
 *           "order": 0
 *         }
 *       ],
 *       "collaborators": []
 *     }
 *   }
 * }
 */
router.get('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    validateRequest
  ],
  getPlaylistById
);

/**
 * @route   PUT /api/playlists/:id
 * @desc    Update playlist information
 * @access  Private (creator or collaborator with edit permissions)
 * @param   {string} id - Playlist ID (MongoDB ObjectId)
 * @param   {Object} body - Updated playlist data
 * @param   {string} [body.name] - New playlist name (1-100 characters)
 * @param   {string} [body.description] - New description (max 500 characters)
 * @param   {boolean} [body.isPublic] - New public status
 * @param   {Array} [body.collaborators] - Array of collaborator IDs
 * @returns {Object} 200 - Updated playlist object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (insufficient permissions)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "name": "Updated Playlist Name",
 *   "description": "Updated description",
 *   "isPublic": false
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Playlist updated successfully",
 *   "data": {
 *     "playlist": {
 *       "_id": "playlist_id",
 *       "name": "Updated Playlist Name",
 *       "description": "Updated description",
 *       "isPublic": false
 *     }
 *   }
 * }
 */
router.put('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    body('name').optional().isLength({ min: 1, max: 100 }).trim().withMessage('Name must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).trim().withMessage('Description must be less than 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    body('collaborators').optional().isArray().withMessage('Collaborators must be an array'),
    body('collaborators.*').optional().isMongoId().withMessage('Invalid collaborator ID'),
    validateRequest
  ],
  updatePlaylist
);

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Delete a playlist and all its songs
 * @access  Private (creator only)
 * @param   {string} id - Playlist ID (MongoDB ObjectId)
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - Invalid playlist ID
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (not creator)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "message": "Playlist deleted successfully"
 * }
 */
router.delete('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    validateRequest
  ],
  deletePlaylist
);

/**
 * @route   POST /api/playlists/:id/collaborators
 * @desc    Add a collaborator to a playlist
 * @access  Private (creator only)
 * @param   {string} id - Playlist ID (MongoDB ObjectId)
 * @param   {Object} body - Collaborator data
 * @param   {string} body.userId - User ID to add as collaborator
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - Validation error or user already collaborator
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (not creator)
 * @returns {Object} 404 - Playlist or user not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request body:
 * {
 *   "userId": "user_id_to_add"
 * }
 * 
 * // Response:
 * {
 *   "message": "Collaborator added successfully"
 * }
 */
router.post('/:id/collaborators', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req, res) => {
    // ...existing code...
    try {
      const playlist = await Playlist.findById(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      // Only creator can add collaborators
      if (playlist.creator.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { userId } = req.body;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if already a collaborator
      if (playlist.collaborators.some(collab => collab.user.toString() === userId)) {
        return res.status(400).json({ message: 'User is already a collaborator' });
      }
      
      playlist.collaborators.push({ 
        user: userId,
        role: 'editor',
        joinedAt: new Date()
      });
      await playlist.save();
      
      const io = req.app.get('io');
      io.to(`playlist-${req.params.id}`).emit('collaborator-added', { playlistId: req.params.id, userId });
      
      res.json({ message: 'Collaborator added successfully' });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @route   DELETE /api/playlists/:id/collaborators/:userId
 * @desc    Remove a collaborator from a playlist
 * @access  Private (creator only)
 * @param   {string} id - Playlist ID (MongoDB ObjectId)
 * @param   {string} userId - User ID to remove as collaborator
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - Invalid IDs
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Access denied (not creator)
 * @returns {Object} 404 - Playlist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Response:
 * {
 *   "message": "Collaborator removed successfully"
 * }
 */
router.delete('/:id/collaborators/:userId', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  async (req, res) => {
    // ...existing code...
    try {
      const playlist = await Playlist.findById(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      // Only creator can remove collaborators
      if (playlist.creator.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      playlist.collaborators = playlist.collaborators.filter(
        collab => collab.user.toString() !== req.params.userId
      );
      await playlist.save();
      
      const io = req.app.get('io');
      io.to(`playlist-${req.params.id}`).emit('collaborator-removed', { 
        playlistId: req.params.id, 
        userId: req.params.userId 
      });
      
      res.json({ message: 'Collaborator removed successfully' });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
