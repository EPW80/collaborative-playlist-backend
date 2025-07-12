const express = require("express");
const router = express.Router();
const { query, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const spotifyService = require("../services/spotifyService");
const lastfmService = require("../services/lastfmService");

/**
 * @fileoverview Search routes for external music services integration
 * @module routes/search
 * @requires express
 * @requires express-validator
 * @requires ../middleware/auth
 * @requires ../services/spotifyService
 * @requires ../services/lastfmService
 */

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

/**
 * @route   GET /api/search/tracks?q=:query&service=:service&limit=:limit
 * @desc    Search for tracks across multiple music services
 * @access  Private
 * @param   {string} q - Search query (min 1 character, required)
 * @param   {string} [service=all] - Service to search ('spotify', 'lastfm', 'all')
 * @param   {number} [limit=20] - Maximum number of results (1-50)
 * @returns {Object} 200 - Search results from specified services
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/search/tracks?q=bohemian%20rhapsody&service=all&limit=10
 *
 * // Response:
 * {
 *   "query": "bohemian rhapsody",
 *   "service": "all",
 *   "results": {
 *     "spotify": [
 *       {
 *         "id": "4u7EnebtmKWzUH433cf5Qv",
 *         "name": "Bohemian Rhapsody",
 *         "artists": [{ "name": "Queen" }],
 *         "album": { "name": "A Night at the Opera" },
 *         "duration_ms": 355000,
 *         "preview_url": "https://p.scdn.co/mp3-preview/..."
 *       }
 *     ],
 *     "lastfm": [
 *       {
 *         "name": "Bohemian Rhapsody",
 *         "artist": "Queen",
 *         "url": "https://www.last.fm/music/Queen/_/Bohemian+Rhapsody",
 *         "listeners": "1234567"
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  "/tracks",
  [
    query("q").isLength({ min: 1 }).withMessage("Search query is required"),
    query("service")
      .optional()
      .isIn(["spotify", "lastfm", "all"])
      .withMessage("Invalid service"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { q: query, service = "all", limit = 20 } = req.query;
      const results = {};

      if (service === "spotify" || service === "all") {
        try {
          results.spotify = await spotifyService.searchTracks(query, limit);
        } catch (error) {
          console.error("Spotify search error:", error.message);
          results.spotify = [];
        }
      }

      if (service === "lastfm" || service === "all") {
        try {
          results.lastfm = await lastfmService.searchTracks(query, limit);
        } catch (error) {
          console.error("Last.fm search error:", error.message);
          results.lastfm = [];
        }
      }

      res.json({
        query,
        service,
        results,
      });
    } catch (error) {
      console.error("Error searching tracks:", error);
      res.status(500).json({ message: "Failed to search tracks" });
    }
  }
);

/**
 * @route   GET /api/search/track/:service/:id
 * @desc    Get detailed information about a specific track
 * @access  Private
 * @param   {string} service - Music service ('spotify')
 * @param   {string} id - Track ID from the specified service
 * @returns {Object} 200 - Detailed track information
 * @returns {Object} 400 - Invalid service or validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - Track not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/search/track/spotify/4u7EnebtmKWzUH433cf5Qv
 *
 * // Response:
 * {
 *   "id": "4u7EnebtmKWzUH433cf5Qv",
 *   "name": "Bohemian Rhapsody",
 *   "artists": [
 *     {
 *       "id": "1dfeR4HaWDbWqFHLkxsg1d",
 *       "name": "Queen"
 *     }
 *   ],
 *   "album": {
 *     "id": "6X9k3hgV9OlTCMCWcGh4qS",
 *     "name": "A Night at the Opera",
 *     "images": [{ "url": "https://i.scdn.co/image/..." }]
 *   },
 *   "duration_ms": 355000,
 *   "popularity": 85,
 *   "preview_url": "https://p.scdn.co/mp3-preview/..."
 * }
 */
router.get(
  "/track/:service/:id",
  [
    query("service").isIn(["spotify"]).withMessage("Invalid service"),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { service, id } = req.params;

      let trackInfo;
      if (service === "spotify") {
        trackInfo = await spotifyService.getTrack(id);
      } else {
        return res.status(400).json({ message: "Unsupported service" });
      }

      res.json(trackInfo);
    } catch (error) {
      console.error("Error getting track info:", error);
      res.status(500).json({ message: "Failed to get track information" });
    }
  }
);

/**
 * @route   GET /api/search/artist?name=:name&service=:service
 * @desc    Get detailed information about an artist
 * @access  Private
 * @param   {string} name - Artist name (min 1 character, required)
 * @param   {string} [service=lastfm] - Music service ('lastfm')
 * @returns {Object} 200 - Artist information
 * @returns {Object} 400 - Validation error or unsupported service
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - Artist not found
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/search/artist?name=Queen&service=lastfm
 *
 * // Response:
 * {
 *   "name": "Queen",
 *   "url": "https://www.last.fm/music/Queen",
 *   "bio": {
 *     "summary": "Queen were a British rock band...",
 *     "content": "Full biography content..."
 *   },
 *   "stats": {
 *     "listeners": "4567890",
 *     "playcount": "123456789"
 *   },
 *   "similar": [
 *     { "name": "Led Zeppelin", "url": "..." },
 *     { "name": "The Beatles", "url": "..." }
 *   ],
 *   "tags": [
 *     { "name": "rock", "url": "..." },
 *     { "name": "classic rock", "url": "..." }
 *   ]
 * }
 */
router.get(
  "/artist",
  [
    query("name").isLength({ min: 1 }).withMessage("Artist name is required"),
    query("service").optional().isIn(["lastfm"]).withMessage("Invalid service"),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { name, service = "lastfm" } = req.query;

      let artistInfo;
      if (service === "lastfm") {
        artistInfo = await lastfmService.getArtistInfo(name);
      } else {
        return res.status(400).json({ message: "Unsupported service" });
      }

      res.json(artistInfo);
    } catch (error) {
      console.error("Error getting artist info:", error);
      res.status(500).json({ message: "Failed to get artist information" });
    }
  }
);

/**
 * @route   GET /api/search/spotify/auth
 * @desc    Generate Spotify OAuth authorization URL
 * @access  Private
 * @returns {Object} 200 - Authorization URL and state
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/search/spotify/auth
 *
 * // Response:
 * {
 *   "authUrl": "https://accounts.spotify.com/authorize?client_id=...&response_type=code&redirect_uri=...&scope=...&state=abc123",
 *   "state": "abc123"
 * }
 */
router.get("/spotify/auth", (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const authURL = spotifyService.getAuthURL(state);

    // Store state in session or temporary storage for verification
    req.session = req.session || {};
    req.session.spotifyState = state;

    res.json({ authUrl: authURL, state });
  } catch (error) {
    console.error("Error generating Spotify auth URL:", error);
    res.status(500).json({ message: "Failed to generate authorization URL" });
  }
});

/**
 * @route   GET /api/search/spotify/callback?code=:code&state=:state
 * @desc    Handle Spotify OAuth callback and exchange code for tokens
 * @access  Private
 * @param   {string} code - Authorization code from Spotify (required)
 * @param   {string} state - State parameter for CSRF protection (required)
 * @returns {Object} 200 - Authorization successful
 * @returns {Object} 400 - Missing authorization code
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 * @example
 * // Request: GET /api/search/spotify/callback?code=authorization_code_here&state=abc123
 *
 * // Response:
 * {
 *   "message": "Spotify authorization successful",
 *   "hasAccess": true
 * }
 */
router.get("/spotify/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code not provided" });
    }

    const tokens = await spotifyService.exchangeCodeForToken(code);

    // Store tokens securely (in your user model or session)
    // This is a simplified example
    res.json({
      message: "Spotify authorization successful",
      // Don't send actual tokens to client in production
      hasAccess: true,
    });
  } catch (error) {
    console.error("Error in Spotify callback:", error);
    res
      .status(500)
      .json({ message: "Failed to complete Spotify authorization" });
  }
});

module.exports = router;
