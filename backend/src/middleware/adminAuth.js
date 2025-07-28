const { AppError } = require("./errorHandler");
const User = require("../models/User");

/**
 * Middleware to check if user has admin privileges
 * @param {string} requiredRole - Minimum role required ("admin" or "superadmin")
 */
const requireAdmin = (requiredRole = "admin") => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return next(new AppError("Authentication required", 401));
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // Check if user has the required role level
      if (!user.hasRoleLevel(requiredRole)) {
        return next(
          new AppError(
            `Access denied: ${requiredRole} privileges required`,
            403
          )
        );
      }

      // Add user object to request for use in controllers
      req.user = user;
      next();
    } catch (error) {
      next(new AppError("Error checking admin privileges", 500));
    }
  };
};

/**
 * Middleware to check if user is admin or superadmin
 */
const requireAnyAdmin = requireAdmin("admin");

/**
 * Middleware to check if user is superadmin
 */
const requireSuperAdmin = requireAdmin("superadmin");

module.exports = {
  requireAdmin,
  requireAnyAdmin,
  requireSuperAdmin,
};
