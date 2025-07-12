/**
 * Centralized Error Handling Middleware
 * This middleware should be the last middleware in your Express app
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

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  console.error("\n🚨 Error occurred:");
  console.error("Time:", new Date().toISOString());
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("IP:", req.ip);
  console.error("User Agent:", req.get("User-Agent"));
  console.error("Error:", err);

  // Log stack trace in development
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  // Mongoose bad ObjectId (Invalid ID format)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } '${value}' already exists`;
    error = new AppError(message, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
      value: val.value,
    }));
    error = new AppError("Validation failed", 400, errors);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid authentication token";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Authentication token has expired";
    error = new AppError(message, 401);
  }

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File size too large";
    error = new AppError(message, 400);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Unexpected file field";
    error = new AppError(message, 400);
  }

  // MongoDB connection errors
  if (err.name === "MongoNetworkError") {
    const message = "Database connection failed";
    error = new AppError(message, 503);
  }

  if (err.name === "MongoTimeoutError") {
    const message = "Database operation timed out";
    error = new AppError(message, 504);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = "Too many requests, please try again later";
    error = new AppError(message, 429);
  }

  // Express validator errors
  if (err.array && typeof err.array === "function") {
    const validationErrors = err.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    error = new AppError("Request validation failed", 400, validationErrors);
  }

  // Axios/HTTP errors from external APIs
  if (err.response) {
    const message = `External API error: ${err.response.status} ${err.response.statusText}`;
    error = new AppError(message, err.response.status >= 500 ? 502 : 400);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : "Something went wrong";

  // Format response
  const response = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack;
    response.error.details = {
      name: err.name,
      path: req.path,
      method: req.method,
      params: req.params,
      query: req.query,
      body: req.body
        ? JSON.stringify(req.body).substring(0, 200) + "..."
        : null,
    };
  }

  // Add validation errors if present
  if (error.errors) {
    response.error.validation = error.errors;
  }

  // Send error response
  res.status(statusCode).json(response);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new AppError(message, 404);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Unhandled promise rejection handler
const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (err, promise) => {
    console.error("🚨 Unhandled Promise Rejection:", err.message);
    console.error("Stack:", err.stack);

    // Close server gracefully
    process.exit(1);
  });
};

// Uncaught exception handler
const handleUncaughtException = () => {
  process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err.message);
    console.error("Stack:", err.stack);

    // Close server gracefully
    process.exit(1);
  });
};

// Setup process-level error handlers
const handleProcessErrors = () => {
  handleUnhandledRejection();
  handleUncaughtException();
};

module.exports = {
  AppError,
  errorHandler,
  globalErrorHandler: errorHandler, // Alias for backward compatibility
  notFoundHandler,
  asyncHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  handleProcessErrors,
};
