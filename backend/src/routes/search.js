const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const spotifyService = require('../services/spotifyService');
const lastfmService = require('../services/lastfmService');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply auth middleware to all search routes
router.use(auth);

// Search tracks across multiple services
router.get('/tracks', 
  [
    query('q').isLength({ min: 1 }).withMessage('Search query is required'),
    query('service').optional().isIn(['spotify', 'lastfm', 'all']).withMessage('Invalid service'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { q: query, service = 'all', limit = 20 } = req.query;
      const results = {};

      if (service === 'spotify' || service === 'all') {
        try {
          results.spotify = await spotifyService.searchTracks(query, limit);
        } catch (error) {
          console.error('Spotify search error:', error.message);
          results.spotify = [];
        }
      }

      if (service === 'lastfm' || service === 'all') {
        try {
          results.lastfm = await lastfmService.searchTracks(query, limit);
        } catch (error) {
          console.error('Last.fm search error:', error.message);
          results.lastfm = [];
        }
      }

      res.json({
        query,
        service,
        results
      });
    } catch (error) {
      console.error('Error searching tracks:', error);
      res.status(500).json({ message: 'Failed to search tracks' });
    }
  }
);

// Get detailed track information
router.get('/track/:service/:id', 
  [
    query('service').isIn(['spotify']).withMessage('Invalid service'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { service, id } = req.params;

      let trackInfo;
      if (service === 'spotify') {
        trackInfo = await spotifyService.getTrack(id);
      } else {
        return res.status(400).json({ message: 'Unsupported service' });
      }

      res.json(trackInfo);
    } catch (error) {
      console.error('Error getting track info:', error);
      res.status(500).json({ message: 'Failed to get track information' });
    }
  }
);

// Get artist information
router.get('/artist', 
  [
    query('name').isLength({ min: 1 }).withMessage('Artist name is required'),
    query('service').optional().isIn(['lastfm']).withMessage('Invalid service'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { name, service = 'lastfm' } = req.query;

      let artistInfo;
      if (service === 'lastfm') {
        artistInfo = await lastfmService.getArtistInfo(name);
      } else {
        return res.status(400).json({ message: 'Unsupported service' });
      }

      res.json(artistInfo);
    } catch (error) {
      console.error('Error getting artist info:', error);
      res.status(500).json({ message: 'Failed to get artist information' });
    }
  }
);

// Spotify OAuth routes
router.get('/spotify/auth', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const authURL = spotifyService.getAuthURL(state);
    
    // Store state in session or temporary storage for verification
    req.session = req.session || {};
    req.session.spotifyState = state;
    
    res.json({ authUrl: authURL, state });
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

router.get('/spotify/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code not provided' });
    }

    const tokens = await spotifyService.exchangeCodeForToken(code);
    
    // Store tokens securely (in your user model or session)
    // This is a simplified example
    res.json({ 
      message: 'Spotify authorization successful',
      // Don't send actual tokens to client in production
      hasAccess: true 
    });
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    res.status(500).json({ message: 'Failed to complete Spotify authorization' });
  }
});

module.exports = router;
