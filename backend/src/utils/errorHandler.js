/**
 * Error handling utilities for consistent error responses
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
const ErrorTypes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  SERVER_ERROR: "SERVER_ERROR",
};

// Error response formatter
const formatErrorResponse = (error, req = null) => {
  const response = {
    success: false,
    message: error.message || "An error occurred",
    timestamp: new Date().toISOString(),
  };

  // Add request info in development
  if (process.env.NODE_ENV === "development" && req) {
    response.path = req.path;
    response.method = req.method;
  }

  // Add validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return response;
};

// Common error handlers
const handleValidationError = (res, errors) => {
  const error = new AppError("Validation failed", 400, errors);
  return res.status(400).json(formatErrorResponse(error));
};

const handleNotFound = (res, resource = "Resource") => {
  const error = new AppError(`${resource} not found`, 404);
  return res.status(404).json(formatErrorResponse(error));
};

const handleUnauthorized = (res, message = "Authentication required") => {
  const error = new AppError(message, 401);
  return res.status(401).json(formatErrorResponse(error));
};

const handleForbidden = (res, message = "Access denied") => {
  const error = new AppError(message, 403);
  return res.status(403).json(formatErrorResponse(error));
};

const handleConflict = (res, message = "Resource already exists") => {
  const error = new AppError(message, 409);
  return res.status(409).json(formatErrorResponse(error));
};

const handleServerError = (
  res,
  message = "Internal server error",
  originalError = null
) => {
  console.error("Server Error:", originalError || message);

  const error = new AppError(
    process.env.NODE_ENV === "production" ? "Internal server error" : message,
    500
  );

  return res.status(500).json(formatErrorResponse(error));
};

// Success response formatter
const formatSuccessResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Set default error values
  let err = { ...error };
  err.message = error.message;

  // Log error
  console.error("Error:", error);

  // Mongoose bad ObjectId
  if (error.name === "CastError") {
    const message = "Invalid ID format";
    err = new AppError(message, 400);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const message = "Duplicate field value entered";
    err = new AppError(message, 400);
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    err = new AppError("Validation failed", 400, errors);
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    const message = "Invalid token";
    err = new AppError(message, 401);
  }

  if (error.name === "TokenExpiredError") {
    const message = "Token expired";
    err = new AppError(message, 401);
  }

  res.status(err.statusCode || 500).json(formatErrorResponse(err, req));
};

module.exports = {
  AppError,
  ErrorTypes,
  formatErrorResponse,
  formatSuccessResponse,
  handleValidationError,
  handleNotFound,
  handleUnauthorized,
  handleForbidden,
  handleConflict,
  handleServerError,
  asyncHandler,
  globalErrorHandler,
};
