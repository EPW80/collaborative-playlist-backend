const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  generatePlaylistNames,
  getSongRecommendations,
  generatePlaylistDescription,
  analyzePlaylist,
  getAIStatus,
  createSmartPlaylist,
} = require("../controllers/aiController");

// Validation middleware
const validatePlaylistId = [
  param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
];

const validateSongsArray = [
  body("songs")
    .isArray({ min: 1 })
    .withMessage("Songs array is required and must contain at least one song"),
  body("songs.*.title").notEmpty().withMessage("Song title is required"),
  body("songs.*.artist").notEmpty().withMessage("Song artist is required"),
];

const validateSmartPlaylistCreation = [
  body("seeds")
    .isArray({ min: 1 })
    .withMessage("Seeds array is required for smart playlist creation"),
  body("autoName")
    .optional()
    .isBoolean()
    .withMessage("autoName must be a boolean"),
  body("autoDescription")
    .optional()
    .isBoolean()
    .withMessage("autoDescription must be a boolean"),
  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean"),
];

/**
 * @route   GET /api/ai/status
 * @desc    Get AI service status and capabilities
 * @access  Public
 */
router.get("/status", getAIStatus);

/**
 * @route   POST /api/ai/generate-names
 * @desc    Generate creative playlist names based on songs
 * @access  Private
 */
router.post("/generate-names", auth, validateSongsArray, generatePlaylistNames);

/**
 * @route   GET /api/ai/recommendations/:playlistId
 * @desc    Get AI-powered song recommendations for a playlist
 * @access  Private
 */
router.post(
  "/recommendations/:playlistId",
  auth,
  validatePlaylistId,
  [
    body("preferences")
      .optional()
      .isObject()
      .withMessage("Preferences must be an object"),
  ],
  getSongRecommendations
);

/**
 * @route   POST /api/ai/generate-description/:playlistId
 * @desc    Generate playlist description using AI
 * @access  Private
 */
router.post(
  "/generate-description/:playlistId",
  auth,
  validatePlaylistId,
  [
    body("updatePlaylist")
      .optional()
      .isBoolean()
      .withMessage("updatePlaylist must be a boolean"),
  ],
  generatePlaylistDescription
);

/**
 * @route   GET /api/ai/analyze/:playlistId
 * @desc    Analyze playlist and provide AI insights
 * @access  Private
 */
router.get("/analyze/:playlistId", auth, validatePlaylistId, analyzePlaylist);

/**
 * @route   POST /api/ai/smart-playlist
 * @desc    Create a smart playlist with AI assistance
 * @access  Private
 */
router.post(
  "/smart-playlist",
  auth,
  validateSmartPlaylistCreation,
  createSmartPlaylist
);

module.exports = router;
