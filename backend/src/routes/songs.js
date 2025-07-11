const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { getSongs, addSong, removeSong, searchSongs } = require('../controllers/song.controller');

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

// Get all songs from a playlist
router.get('/', 
  [
    query('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    validateRequest
  ],
  getSongs
);

// Search for songs in a playlist
router.get('/search', 
  [
    query('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    query('q').isLength({ min: 1 }).withMessage('Search query is required'),
    validateRequest
  ],
  searchSongs
);

// Add a song to a playlist
router.post('/', 
  [
    body('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    body('name').isLength({ min: 1, max: 200 }).trim().withMessage('Song name must be 1-200 characters'),
    body('artist').isLength({ min: 1, max: 200 }).trim().withMessage('Artist name must be 1-200 characters'),
    body('album').optional().isLength({ max: 200 }).trim().withMessage('Album name must be less than 200 characters'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    validateRequest
  ],
  addSong
);

// Remove a song from a playlist
router.delete('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid song ID'),
    query('playlistId').isMongoId().withMessage('Valid playlist ID is required'),
    validateRequest
  ],
  removeSong
);

module.exports = router;
