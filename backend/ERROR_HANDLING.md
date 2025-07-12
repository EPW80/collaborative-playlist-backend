# Error Handling Implementation

This document explains the comprehensive error handling system implemented in the Collaborative Playlist Manager backend.

## Overview

Our error handling system provides:
- **Centralized error management** with custom AppError class
- **Consistent API responses** across all endpoints
- **Production-ready logging** with request context
- **Specific error handlers** for common error types
- **Process-level error handling** for unhandled rejections and exceptions

## Components

### 1. AppError Class (`src/middleware/errorHandler.js`)

Custom error class for operational errors:

```javascript
class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // For validation errors
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Properties:**
- `statusCode`: HTTP status code
- `status`: 'fail' for 4xx errors, 'error' for 5xx errors
- `isOperational`: Identifies expected operational errors
- `errors`: Additional error details (e.g., validation errors)

### 2. Async Error Handler (`asyncHandler`)

Wrapper function that catches async errors and passes them to Express error middleware:

```javascript
const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```

**Usage in controllers:**
```javascript
exports.createPlaylist = asyncHandler(async (req, res, next) => {
  // Controller logic here
  // Any thrown error or rejected promise is automatically caught
});
```

### 3. Global Error Handler (`globalErrorHandler`)

Central error processing middleware that:
- Logs errors with request context
- Transforms specific error types (MongoDB, JWT, etc.)
- Returns consistent JSON responses
- Handles development vs production error details

**Response Format:**
```javascript
{
  success: false,
  message: "Error description",
  error: {
    statusCode: 400,
    status: "fail",
    timestamp: "2024-01-01T12:00:00.000Z",
    path: "/api/playlists",
    method: "POST"
  },
  // Additional fields in development mode:
  stack: "Error stack trace...",
  errors: [] // Validation errors if applicable
}
```

### 4. Specific Error Handlers

#### MongoDB Errors
- **CastError**: Invalid ObjectId format
- **ValidationError**: Schema validation failures
- **DuplicateKeyError**: Unique constraint violations

#### Authentication Errors
- **JsonWebTokenError**: Invalid JWT tokens
- **TokenExpiredError**: Expired JWT tokens

#### Rate Limiting Errors
- **TooManyRequestsError**: Rate limit exceeded

#### Multer Errors (File Upload)
- **MulterError**: File upload failures

### 5. Process-Level Error Handling

Handles uncaught exceptions and unhandled promise rejections:

```javascript
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
```

## Controller Implementation

### Before (Old Error Handling)
```javascript
exports.createPlaylist = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const playlist = new Playlist({ name, description });
    await playlist.save();
    
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### After (New Error Handling)
```javascript
exports.createPlaylist = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;
  
  if (!name || name.trim() === '') {
    return next(new AppError('Playlist name is required', 400));
  }
  
  const playlist = new Playlist({ 
    name: name.trim(), 
    description: description?.trim() || '' 
  });
  await playlist.save();
  
  res.status(201).json({
    success: true,
    message: "Playlist created successfully",
    data: { playlist }
  });
});
```

## Benefits

### 1. **Consistency**
- All API responses follow the same format
- Error messages are clear and informative
- HTTP status codes are used correctly

### 2. **Maintainability**
- Centralized error handling logic
- No repetitive try/catch blocks
- Easy to modify error behavior globally

### 3. **Debugging**
- Comprehensive logging with request context
- Stack traces in development mode
- Structured error information

### 4. **Security**
- Sensitive information hidden in production
- Consistent error responses prevent information leakage
- Proper handling of authentication errors

### 5. **User Experience**
- Clear error messages for client applications
- Consistent response structure for frontend handling
- Proper HTTP status codes for API consumers

## Testing

Run the error handling test suite:

```bash
npm run test:errors
```

This will test:
- 404 errors for non-existent routes
- Validation errors for missing required fields
- Authentication errors with invalid tokens
- MongoDB errors with invalid ObjectIds
- Rate limiting behavior

## Usage Guidelines

### 1. **In Controllers**
Always use `asyncHandler` wrapper:
```javascript
exports.myController = asyncHandler(async (req, res, next) => {
  // Your code here
});
```

### 2. **For Validation Errors**
Use AppError with validation details:
```javascript
if (!email || !password) {
  return next(new AppError('Email and password are required', 400));
}
```

### 3. **For Permission Errors**
Use appropriate status codes:
```javascript
if (playlist.creator.toString() !== req.userId) {
  return next(new AppError('Access denied: You can only delete your own playlists', 403));
}
```

### 4. **For Not Found Errors**
Consistent 404 handling:
```javascript
if (!playlist) {
  return next(new AppError('Playlist not found', 404));
}
```

## Monitoring and Logging

The error handler logs errors with:
- Timestamp
- HTTP method and path
- User ID (if authenticated)
- IP address
- User agent
- Full error details

**Example log output:**
```
[2024-01-01T12:00:00.000Z] ERROR - ValidationError: Playlist name is required
Request: POST /api/playlists
User: 507f1f77bcf86cd799439011
IP: 192.168.1.100
User-Agent: Mozilla/5.0...
Stack: ValidationError: Playlist name is required
    at PlaylistController.createPlaylist...
```

## Future Enhancements

1. **Error Aggregation**: Collect and analyze error patterns
2. **Alerting**: Notify administrators of critical errors
3. **Performance Monitoring**: Track error impact on performance
4. **Error Recovery**: Implement retry mechanisms for transient failures
5. **Custom Error Pages**: User-friendly error pages for web interface

## Environment Configuration

Set these environment variables for optimal error handling:

```bash
NODE_ENV=production          # Hides sensitive error details
LOG_LEVEL=error             # Controls logging verbosity
ENABLE_ERROR_REPORTING=true # Enable/disable external error reporting
```

## Related Files

- `src/middleware/errorHandler.js` - Main error handling implementation
- `server.js` - Process-level error handling setup
- `src/routes/index.js` - 404 handler for undefined routes
- `test-error-handling.js` - Comprehensive error handling tests
- All controller files - Updated to use new error handling pattern
