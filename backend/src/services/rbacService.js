/**
 * @fileoverview Role-Based Access Control (RBAC) Service
 * @module services/rbacService
 */

const Playlist = require("../models/Playlist");
const { AppError } = require("../middleware/errorHandler");

/**
 * Enhanced Role-Based Access Control System
 * Roles: viewer, contributor, editor, admin, owner
 */
class RBACService {
  constructor() {
    // Define role hierarchy (higher number = more permissions)
    this.roleHierarchy = {
      viewer: 1,
      contributor: 2,
      editor: 3,
      admin: 4,
      owner: 5,
    };

    // Define permissions for each role
    this.rolePermissions = {
      viewer: {
        canView: true,
        canSuggest: false,
        canEdit: false,
        canManageCollaborators: false,
        canDelete: false,
        canApprove: false,
        canReject: false,
        canManageSettings: false,
      },
      contributor: {
        canView: true,
        canSuggest: true,
        canEdit: false,
        canManageCollaborators: false,
        canDelete: false,
        canApprove: false,
        canReject: false,
        canManageSettings: false,
      },
      editor: {
        canView: true,
        canSuggest: true,
        canEdit: true,
        canManageCollaborators: false,
        canDelete: false,
        canApprove: true,
        canReject: true,
        canManageSettings: false,
      },
      admin: {
        canView: true,
        canSuggest: true,
        canEdit: true,
        canManageCollaborators: true,
        canDelete: false,
        canApprove: true,
        canReject: true,
        canManageSettings: true,
      },
      owner: {
        canView: true,
        canSuggest: true,
        canEdit: true,
        canManageCollaborators: true,
        canDelete: true,
        canApprove: true,
        canReject: true,
        canManageSettings: true,
      },
    };
  }

  /**
   * Get user's role in a playlist
   * @param {string} userId - User ID
   * @param {Object} playlist - Playlist object
   * @returns {string} User's role
   */
  getUserRole(userId, playlist) {
    // Owner has highest privileges
    if (playlist.creator.toString() === userId) {
      return "owner";
    }

    // Find user in collaborators
    const collaborator = playlist.collaborators.find(
      (collab) => collab.user.toString() === userId
    );

    if (collaborator) {
      return collaborator.role;
    }

    // If playlist is public, user is a viewer
    if (playlist.isPublic) {
      return "viewer";
    }

    // No access
    return null;
  }

  /**
   * Check if user has specific permission
   * @param {string} userId - User ID
   * @param {Object} playlist - Playlist object
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether user has permission
   */
  hasPermission(userId, playlist, permission) {
    const userRole = this.getUserRole(userId, playlist);
    
    if (!userRole) {
      return false;
    }

    return this.rolePermissions[userRole][permission] || false;
  }

  /**
   * Check if user has access to playlist
   * @param {string} userId - User ID
   * @param {Object} playlist - Playlist object
   * @returns {boolean} Whether user has access
   */
  hasAccess(userId, playlist) {
    return this.getUserRole(userId, playlist) !== null;
  }

  /**
   * Validate if user can perform action on playlist
   * @param {string} userId - User ID
   * @param {string} playlistId - Playlist ID
   * @param {string} permission - Required permission
   * @throws {AppError} If user doesn't have permission
   */
  async validatePermission(userId, playlistId, permission) {
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
      throw new AppError("Playlist not found", 404);
    }

    if (!this.hasPermission(userId, playlist, permission)) {
      const userRole = this.getUserRole(userId, playlist);
      throw new AppError(
        `Access denied. Required permission: ${permission}. Your role: ${userRole || "none"}`,
        403
      );
    }

    return playlist;
  }

  /**
   * Get all permissions for user in playlist
   * @param {string} userId - User ID
   * @param {Object} playlist - Playlist object
   * @returns {Object} User's permissions
   */
  getUserPermissions(userId, playlist) {
    const userRole = this.getUserRole(userId, playlist);
    
    if (!userRole) {
      return {};
    }

    return {
      role: userRole,
      permissions: this.rolePermissions[userRole],
    };
  }

  /**
   * Add collaborator with specific role
   * @param {Object} playlist - Playlist object
   * @param {string} userId - User ID to add
   * @param {string} role - Role to assign
   * @param {string} invitedBy - User ID who is inviting
   * @returns {Object} Updated playlist
   */
  async addCollaborator(playlist, userId, role, invitedBy) {
    // Validate role
    if (!this.rolePermissions[role]) {
      throw new AppError(`Invalid role: ${role}`, 400);
    }

    // Check if user is already a collaborator
    const existingCollaborator = playlist.collaborators.find(
      (collab) => collab.user.toString() === userId
    );

    if (existingCollaborator) {
      throw new AppError("User is already a collaborator", 400);
    }

    // Add collaborator
    playlist.collaborators.push({
      user: userId,
      role: role,
      invitedBy: invitedBy,
      permissions: this.rolePermissions[role],
    });

    return playlist.save();
  }

  /**
   * Update collaborator role
   * @param {Object} playlist - Playlist object
   * @param {string} userId - User ID to update
   * @param {string} newRole - New role to assign
   * @returns {Object} Updated playlist
   */
  async updateCollaboratorRole(playlist, userId, newRole) {
    // Validate role
    if (!this.rolePermissions[newRole]) {
      throw new AppError(`Invalid role: ${newRole}`, 400);
    }

    const collaborator = playlist.collaborators.find(
      (collab) => collab.user.toString() === userId
    );

    if (!collaborator) {
      throw new AppError("User is not a collaborator", 404);
    }

    // Update role and permissions
    collaborator.role = newRole;
    collaborator.permissions = this.rolePermissions[newRole];

    return playlist.save();
  }

  /**
   * Remove collaborator
   * @param {Object} playlist - Playlist object
   * @param {string} userId - User ID to remove
   * @returns {Object} Updated playlist
   */
  async removeCollaborator(playlist, userId) {
    const collaboratorIndex = playlist.collaborators.findIndex(
      (collab) => collab.user.toString() === userId
    );

    if (collaboratorIndex === -1) {
      throw new AppError("User is not a collaborator", 404);
    }

    playlist.collaborators.splice(collaboratorIndex, 1);
    return playlist.save();
  }

  /**
   * Check if role can manage another role
   * @param {string} managerRole - Role of the manager
   * @param {string} targetRole - Role being managed
   * @returns {boolean} Whether manager can manage target
   */
  canManageRole(managerRole, targetRole) {
    return this.roleHierarchy[managerRole] > this.roleHierarchy[targetRole];
  }

  /**
   * Get available roles that user can assign
   * @param {string} userRole - Current user's role
   * @returns {Array} List of roles user can assign
   */
  getAssignableRoles(userRole) {
    const userLevel = this.roleHierarchy[userRole];
    const assignableRoles = [];

    for (const [role, level] of Object.entries(this.roleHierarchy)) {
      if (level < userLevel && role !== "owner") {
        assignableRoles.push(role);
      }
    }

    return assignableRoles;
  }

  /**
   * Validate playlist access with enhanced error messages
   * @param {string} userId - User ID
   * @param {string} playlistId - Playlist ID
   * @returns {Object} Playlist and user role
   */
  async validateAccess(userId, playlistId) {
    const playlist = await Playlist.findById(playlistId).populate([
      { path: "creator", select: "username email" },
      { path: "collaborators.user", select: "username email" },
    ]);

    if (!playlist) {
      throw new AppError("Playlist not found", 404);
    }

    const userRole = this.getUserRole(userId, playlist);
    
    if (!userRole) {
      throw new AppError(
        "Access denied. You need to be invited to access this private playlist.",
        403
      );
    }

    return { playlist, userRole, permissions: this.rolePermissions[userRole] };
  }
}

module.exports = new RBACService();
