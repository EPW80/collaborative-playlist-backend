/**
 * @fileoverview RBAC Routes for role-based access control
 * @module routes/rbac
 */

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const {
  getUserPermissions,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  getCollaborators,
  getRoles,
  leavePlaylist,
  transferOwnership,
} = require("../controllers/rbac.controller");

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
 * @route GET /api/rbac/permissions/:playlistId
 * @desc Get user's permissions for a playlist
 * @access Private
 */
router.get(
  "/permissions/:playlistId",
  auth,
  [param("playlistId").isMongoId().withMessage("Invalid playlist ID")],
  validateRequest,
  getUserPermissions
);

/**
 * @route POST /api/rbac/collaborators/:playlistId
 * @desc Add collaborator to playlist with specific role
 * @access Private
 */
router.post(
  "/collaborators/:playlistId",
  auth,
  [
    param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    body("userIdentifier")
      .notEmpty()
      .withMessage("User email or username is required"),
    body("role")
      .optional()
      .isIn(["viewer", "contributor", "editor", "admin"])
      .withMessage(
        "Invalid role. Must be: viewer, contributor, editor, or admin"
      ),
  ],
  validateRequest,
  addCollaborator
);

/**
 * @route PUT /api/rbac/collaborators/:playlistId/:userId
 * @desc Update collaborator role
 * @access Private
 */
router.put(
  "/collaborators/:playlistId/:userId",
  auth,
  [
    param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    param("userId").isMongoId().withMessage("Invalid user ID"),
    body("role")
      .isIn(["viewer", "contributor", "editor", "admin"])
      .withMessage(
        "Invalid role. Must be: viewer, contributor, editor, or admin"
      ),
  ],
  validateRequest,
  updateCollaboratorRole
);

/**
 * @route DELETE /api/rbac/collaborators/:playlistId/:userId
 * @desc Remove collaborator from playlist
 * @access Private
 */
router.delete(
  "/collaborators/:playlistId/:userId",
  auth,
  [
    param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    param("userId").isMongoId().withMessage("Invalid user ID"),
  ],
  validateRequest,
  removeCollaborator
);

/**
 * @route GET /api/rbac/collaborators/:playlistId
 * @desc Get all collaborators with their roles and permissions
 * @access Private
 */
router.get(
  "/collaborators/:playlistId",
  auth,
  [param("playlistId").isMongoId().withMessage("Invalid playlist ID")],
  validateRequest,
  getCollaborators
);

/**
 * @route GET /api/rbac/roles
 * @desc Get available roles and their permissions
 * @access Private
 */
router.get("/roles", auth, getRoles);

/**
 * @route POST /api/rbac/leave/:playlistId
 * @desc Leave playlist (self-remove)
 * @access Private
 */
router.post(
  "/leave/:playlistId",
  auth,
  [param("playlistId").isMongoId().withMessage("Invalid playlist ID")],
  validateRequest,
  leavePlaylist
);

/**
 * @route POST /api/rbac/transfer-ownership/:playlistId
 * @desc Transfer playlist ownership
 * @access Private (Owner only)
 */
router.post(
  "/transfer-ownership/:playlistId",
  auth,
  [
    param("playlistId").isMongoId().withMessage("Invalid playlist ID"),
    body("newOwnerId").isMongoId().withMessage("Invalid new owner ID"),
  ],
  validateRequest,
  transferOwnership
);

module.exports = router;
