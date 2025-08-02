require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const http = require("http");
const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const securityMiddleware = require("./src/middleware/security");
const { handleProcessErrors } = require("./src/middleware/errorHandler");
const connectDB = require("./src/config/database");
const realtimeService = require("./src/services/realtimeService");

// Set up process-level error handling
handleProcessErrors();

const app = express();
const server = http.createServer(app);

// Trust proxy for production deployment (Render, Heroku, etc.)
app.set("trust proxy", 1);

// Redis setup for Socket.io scaling
const setupRedisAdapter = async (io) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_HOST) {
      console.log("🔧 Setting up Redis adapter for Socket.io scaling...");
      
      const pubClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      });
      
      const subClient = pubClient.duplicate();
      
      await pubClient.connect();
      await subClient.connect();
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Redis adapter configured for Socket.io");
      
      return { pubClient, subClient };
    } else {
      console.log("ℹ️  Using default Socket.io adapter (single instance)");
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to setup Redis adapter:", error);
    console.log("⚠️  Falling back to default Socket.io adapter");
    return null;
  }
};

const io = socketIO(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://frontend-epws-projects.vercel.app",
      "https://frontend-epw80-epws-projects.vercel.app",
      "https://frontend-29kvf1dnb-epws-projects.vercel.app",
      "https://frontend-pwe6ouxg7-epws-projects.vercel.app",
      "https://frontend-dr5de4z33-epws-projects.vercel.app",
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Performance optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  transports: ["websocket", "polling"],
});

// Setup Redis adapter for horizontal scaling
setupRedisAdapter(io).then((redisClients) => {
  console.log("🚀 Socket.io server configured with optimal settings");
  
  // Initialize real-time service
  realtimeService.initialize(io, redisClients);
  
  // Store Redis clients for cleanup
  if (redisClients) {
    app.set("redisClients", redisClients);
  }
}).catch(error => {
  console.error("Failed to setup Socket.io:", error);
  // Initialize real-time service anyway
  realtimeService.initialize(io);
});

// Apply security middleware
securityMiddleware(app);

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://frontend-epws-projects.vercel.app",
      "https://frontend-epw80-epws-projects.vercel.app",
      "https://frontend-29kvf1dnb-epws-projects.vercel.app",
      "https://frontend-pwe6ouxg7-epws-projects.vercel.app",
      "https://frontend-dr5de4z33-epws-projects.vercel.app",
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
connectDB();

// Make io and realtime service accessible to routes
app.set("io", io);
app.set("realtimeService", realtimeService);

// Configure routes
require("./src/routes")(app);

// 404 handler for undefined routes
app.use("*", (req, res, next) => {
  const { AppError } = require("./src/middleware/errorHandler");
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler
app.use(require("./src/middleware/errorHandler").globalErrorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🎵 Collaborative Playlist Manager API Ready`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Close Redis clients if they exist
  const redisClients = app.get('redisClients');
  if (redisClients) {
    try {
      await redisClients.pubClient.quit();
      await redisClients.subClient.quit();
      console.log('✅ Redis clients closed');
    } catch (error) {
      console.error('❌ Error closing Redis clients:', error);
    }
  }
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  // Close Redis clients if they exist
  const redisClients = app.get('redisClients');
  if (redisClients) {
    try {
      await redisClients.pubClient.quit();
      await redisClients.subClient.quit();
      console.log('✅ Redis clients closed');
    } catch (error) {
      console.error('❌ Error closing Redis clients:', error);
    }
  }
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});
