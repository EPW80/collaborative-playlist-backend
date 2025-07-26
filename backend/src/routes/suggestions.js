/**
 * @fileoverview Song Suggestions Routes
 * @module routes/suggestions
 */

const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const {
  submitSuggestion,
  getPendingSuggestions,
  approveSuggestion,
  rejectSuggestion,
  deleteSuggestion,
  getMySuggestions,
} = require("../controllers/suggestions.controller");

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route POST /api/suggestions/:playlistId
 * @desc Submit song suggestion (for contributors)
 * @access Private
 */
router.post(
  "/:playlistId",
  auth,
  [
    param("playlistId")
      .isMongoId()
      .withMessage("Invalid playlist ID"),
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Song title is required")
      .isLength({ max: 200 })
      .withMessage("Title must be less than 200 characters"),
    body("artist")
      .trim()
      .notEmpty()
      .withMessage("Artist name is required")
      .isLength({ max: 200 })
      .withMessage("Artist name must be less than 200 characters"),
    body("album")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Album name must be less than 200 characters"),
    body("duration")
      .optional()
      .isInt({ min: 1, max: 7200 })
      .withMessage("Duration must be between 1 and 7200 seconds"),
    body("spotifyId")
      .optional()
      .trim(),
    body("youtubeId")
      .optional()
      .trim(),
    body("geniusId")
      .optional()
      .trim(),
    body("previewUrl")
      .optional()
      .isURL()
      .withMessage("Preview URL must be valid"),
    body("imageUrl")
      .optional()
      .isURL()
      .withMessage("Image URL must be valid"),
  ],
  validateRequest,
  submitSuggestion
);

/**
 * @route GET /api/suggestions/:playlistId
 * @desc Get pending suggestions for a playlist
 * @access Private
 */
router.get(
  "/:playlistId",
  auth,
  [
    param("playlistId")
      .isMongoId()
      .withMessage("Invalid playlist ID"),
    query("status")
      .optional()
      .isIn(["pending", "approved", "rejected"])
      .withMessage("Status must be: pending, approved, or rejected"),
  ],
  validateRequest,
  getPendingSuggestions
);

/**
 * @route POST /api/suggestions/:playlistId/:suggestionId/approve
 * @desc Approve song suggestion
 * @access Private
 */
router.post(
  "/:playlistId/:suggestionId/approve",
  auth,
  [
    param("playlistId")
      .isMongoId()
      .withMessage("Invalid playlist ID"),
    param("suggestionId")
      .isMongoId()
      .withMessage("Invalid suggestion ID"),
    body("reviewNote")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Review note must be less than 500 characters"),
  ],
  validateRequest,
  approveSuggestion
);

/**
 * @route POST /api/suggestions/:playlistId/:suggestionId/reject
 * @desc Reject song suggestion
 * @access Private
 */
router.post(
  "/:playlistId/:suggestionId/reject",
  auth,
  [
    param("playlistId")
      .isMongoId()
      .withMessage("Invalid playlist ID"),
    param("suggestionId")
      .isMongoId()
      .withMessage("Invalid suggestion ID"),
    body("reviewNote")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Review note must be less than 500 characters"),
  ],
  validateRequest,
  rejectSuggestion
);

/**
 * @route DELETE /api/suggestions/:playlistId/:suggestionId
 * @desc Delete suggestion (by suggester or admin+)
 * @access Private
 */
router.delete(
  "/:playlistId/:suggestionId",
  auth,
  [
    param("playlistId")
      .isMongoId()
      .withMessage("Invalid playlist ID"),
    param("suggestionId")
      .isMongoId()
      .withMessage("Invalid suggestion ID"),
  ],
  validateRequest,
  deleteSuggestion
);

/**
 * @route GET /api/suggestions/my-suggestions/:playlistId
 * @desc Get user's own suggestions
 * @access Private
 */
router.get(
  "/my-suggestions/:playlistId",
  auth,
  [
    param("playlistId")
      .isMongoId()
      .withMessage("Invalid playlist ID"),
  ],
  validateRequest,
  getMySuggestions
);

module.exports = router;
