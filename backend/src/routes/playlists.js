const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { getPlaylists, createPlaylist, getPlaylistById, updatePlaylist, deletePlaylist } = require('../controllers/playlist.controller');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

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

// Get all playlists
router.get('/', getPlaylists);

// Create a new playlist
router.post('/', 
  [
    body('name').isLength({ min: 1, max: 100 }).trim().withMessage('Name must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).trim().withMessage('Description must be less than 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    validateRequest
  ],
  createPlaylist
);

// Get a playlist by ID
router.get('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    validateRequest
  ],
  getPlaylistById
);

// Update a playlist
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

// Delete a playlist
router.delete('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    validateRequest
  ],
  deletePlaylist
);

// Add collaborator to playlist
router.post('/:id/collaborators', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    validateRequest
  ],
  async (req, res) => {
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
      if (playlist.collaborators.includes(userId)) {
        return res.status(400).json({ message: 'User is already a collaborator' });
      }
      
      playlist.collaborators.push(userId);
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

// Remove collaborator from playlist
router.delete('/:id/collaborators/:userId', 
  [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  async (req, res) => {
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
        collab => collab.toString() !== req.params.userId
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
