/**
 * @fileoverview RBAC Controller for playlist role management
 * @module controllers/rbacController
 */

const { asyncHandler, AppError } = require("../middleware/errorHandler");
const rbacService = require("../services/rbacService");
const Playlist = require("../models/Playlist");
const User = require("../models/User");

/**
 * Get user's permissions for a playlist
 * @route GET /api/rbac/permissions/:playlistId
 * @access Private
 */
exports.getUserPermissions = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.userId;

  const { playlist, userRole, permissions } = await rbacService.validateAccess(
    userId,
    playlistId
  );

  res.json({
    success: true,
    message: "User permissions retrieved",
    data: {
      playlistId,
      userRole,
      permissions,
      canManage: rbacService.hasPermission(
        userId,
        playlist,
        "canManageCollaborators"
      ),
    },
  });
});

/**
 * Add collaborator to playlist with specific role
 * @route POST /api/rbac/collaborators/:playlistId
 * @access Private
 */
exports.addCollaborator = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { userIdentifier, role = "contributor" } = req.body; // email or username
  const inviterId = req.userId;

  // Validate permission to manage collaborators
  const playlist = await rbacService.validatePermission(
    inviterId,
    playlistId,
    "canManageCollaborators"
  );

  // Find user to invite
  const userToInvite = await User.findOne({
    $or: [{ email: userIdentifier }, { username: userIdentifier }],
  });

  if (!userToInvite) {
    throw new AppError("User not found", 404);
  }

  // Check if inviter can assign this role
  const inviterRole = rbacService.getUserRole(inviterId, playlist);
  if (!rbacService.canManageRole(inviterRole, role)) {
    throw new AppError(
      `You cannot assign role '${role}'. Available roles: ${rbacService
        .getAssignableRoles(inviterRole)
        .join(", ")}`,
      403
    );
  }

  // Add collaborator
  await rbacService.addCollaborator(
    playlist,
    userToInvite._id,
    role,
    inviterId
  );

  res.json({
    success: true,
    message: "Collaborator added successfully",
    data: {
      collaborator: {
        user: {
          id: userToInvite._id,
          username: userToInvite.username,
          email: userToInvite.email,
        },
        role,
        permissions: rbacService.rolePermissions[role],
      },
    },
  });
});

/**
 * Update collaborator role
 * @route PUT /api/rbac/collaborators/:playlistId/:userId
 * @access Private
 */
exports.updateCollaboratorRole = asyncHandler(async (req, res) => {
  const { playlistId, userId: targetUserId } = req.params;
  const { role } = req.body;
  const managerId = req.userId;

  // Validate permission to manage collaborators
  const playlist = await rbacService.validatePermission(
    managerId,
    playlistId,
    "canManageCollaborators"
  );

  const managerRole = rbacService.getUserRole(managerId, playlist);
  const currentTargetRole = rbacService.getUserRole(targetUserId, playlist);

  // Check if manager can manage both current and new roles
  if (!rbacService.canManageRole(managerRole, currentTargetRole)) {
    throw new AppError("You cannot manage this user's role", 403);
  }

  if (!rbacService.canManageRole(managerRole, role)) {
    throw new AppError(
      `You cannot assign role '${role}'. Available roles: ${rbacService
        .getAssignableRoles(managerRole)
        .join(", ")}`,
      403
    );
  }

  // Update role
  await rbacService.updateCollaboratorRole(playlist, targetUserId, role);

  res.json({
    success: true,
    message: "Collaborator role updated successfully",
    data: {
      userId: targetUserId,
      newRole: role,
      permissions: rbacService.rolePermissions[role],
    },
  });
});

/**
 * Remove collaborator from playlist
 * @route DELETE /api/rbac/collaborators/:playlistId/:userId
 * @access Private
 */
exports.removeCollaborator = asyncHandler(async (req, res) => {
  const { playlistId, userId: targetUserId } = req.params;
  const managerId = req.userId;

  // Validate permission to manage collaborators
  const playlist = await rbacService.validatePermission(
    managerId,
    playlistId,
    "canManageCollaborators"
  );

  const managerRole = rbacService.getUserRole(managerId, playlist);
  const targetRole = rbacService.getUserRole(targetUserId, playlist);

  // Check if manager can manage target user
  if (!rbacService.canManageRole(managerRole, targetRole)) {
    throw new AppError("You cannot remove this user", 403);
  }

  // Cannot remove the owner
  if (targetRole === "owner") {
    throw new AppError("Cannot remove playlist owner", 400);
  }

  // Remove collaborator
  await rbacService.removeCollaborator(playlist, targetUserId);

  res.json({
    success: true,
    message: "Collaborator removed successfully",
    data: {
      removedUserId: targetUserId,
    },
  });
});

/**
 * Get all collaborators with their roles and permissions
 * @route GET /api/rbac/collaborators/:playlistId
 * @access Private
 */
exports.getCollaborators = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.userId;

  const { playlist } = await rbacService.validateAccess(userId, playlistId);

  // Build collaborators list with roles and permissions
  const collaborators = [
    // Owner
    {
      user: {
        id: playlist.creator._id,
        username: playlist.creator.username,
        email: playlist.creator.email,
      },
      role: "owner",
      permissions: rbacService.rolePermissions.owner,
      joinedAt: playlist.createdAt,
      isOwner: true,
    },
    // Other collaborators
    ...playlist.collaborators.map((collab) => ({
      user: {
        id: collab.user._id,
        username: collab.user.username,
        email: collab.user.email,
      },
      role: collab.role,
      permissions: rbacService.rolePermissions[collab.role],
      joinedAt: collab.joinedAt,
      invitedBy: collab.invitedBy,
      isOwner: false,
    })),
  ];

  // Add current user's management capabilities
  const userRole = rbacService.getUserRole(userId, playlist);
  const canManage = rbacService.hasPermission(
    userId,
    playlist,
    "canManageCollaborators"
  );
  const assignableRoles = canManage
    ? rbacService.getAssignableRoles(userRole)
    : [];

  res.json({
    success: true,
    message: "Collaborators retrieved successfully",
    data: {
      collaborators,
      currentUser: {
        role: userRole,
        canManage,
        assignableRoles,
      },
    },
  });
});

/**
 * Get available roles and their permissions
 * @route GET /api/rbac/roles
 * @access Private
 */
exports.getRoles = asyncHandler(async (req, res) => {
  const roles = Object.entries(rbacService.rolePermissions).map(
    ([role, permissions]) => ({
      role,
      permissions,
      hierarchy: rbacService.roleHierarchy[role],
    })
  );

  res.json({
    success: true,
    message: "Available roles retrieved",
    data: {
      roles,
      hierarchy: rbacService.roleHierarchy,
    },
  });
});

/**
 * Leave playlist (self-remove)
 * @route POST /api/rbac/leave/:playlistId
 * @access Private
 */
exports.leavePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.userId;

  const { playlist } = await rbacService.validateAccess(userId, playlistId);

  const userRole = rbacService.getUserRole(userId, playlist);

  // Owner cannot leave their own playlist
  if (userRole === "owner") {
    throw new AppError(
      "Playlist owner cannot leave. Transfer ownership or delete the playlist instead.",
      400
    );
  }

  // Remove user from collaborators
  await rbacService.removeCollaborator(playlist, userId);

  res.json({
    success: true,
    message: "Successfully left the playlist",
    data: {
      playlistId,
      leftAt: new Date(),
    },
  });
});

/**
 * Transfer playlist ownership
 * @route POST /api/rbac/transfer-ownership/:playlistId
 * @access Private (Owner only)
 */
exports.transferOwnership = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { newOwnerId } = req.body;
  const currentOwnerId = req.userId;

  const playlist = await rbacService.validatePermission(
    currentOwnerId,
    playlistId,
    "canDelete" // Only owner has delete permission
  );

  // Validate new owner is a collaborator
  const newOwnerCollaborator = playlist.collaborators.find(
    (collab) => collab.user.toString() === newOwnerId
  );

  if (!newOwnerCollaborator) {
    throw new AppError("New owner must be an existing collaborator", 400);
  }

  // Transfer ownership
  playlist.creator = newOwnerId;

  // Remove new owner from collaborators list
  playlist.collaborators = playlist.collaborators.filter(
    (collab) => collab.user.toString() !== newOwnerId
  );

  // Add previous owner as admin
  playlist.collaborators.push({
    user: currentOwnerId,
    role: "admin",
    joinedAt: new Date(),
    invitedBy: newOwnerId,
    permissions: rbacService.rolePermissions.admin,
  });

  await playlist.save();

  res.json({
    success: true,
    message: "Ownership transferred successfully",
    data: {
      previousOwner: currentOwnerId,
      newOwner: newOwnerId,
      transferredAt: new Date(),
    },
  });
});

module.exports = {
  getUserPermissions: exports.getUserPermissions,
  addCollaborator: exports.addCollaborator,
  updateCollaboratorRole: exports.updateCollaboratorRole,
  removeCollaborator: exports.removeCollaborator,
  getCollaborators: exports.getCollaborators,
  getRoles: exports.getRoles,
  leavePlaylist: exports.leavePlaylist,
  transferOwnership: exports.transferOwnership,
};
