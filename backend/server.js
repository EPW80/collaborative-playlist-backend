require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const http = require("http");
const securityMiddleware = require("./src/middleware/security");
const { handleProcessErrors } = require("./src/middleware/errorHandler");
const connectDB = require("./src/config/database");
const realtimeService = require("./src/services/realtimeService");

// Set up process-level error handling
handleProcessErrors();

const app = express();
const server = http.createServer(app);

// Trust proxy for production deployment (Render, Heroku, etc.)
app.set('trust proxy', 1);

const io = socketIO(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://collaborative-playlist-manager.vercel.app",
      "https://collaborative-playlist-manager-frontend.vercel.app",
      "https://frontend-fmkzh7bw8-epws-projects.vercel.app",
      "https://frontend-hesppgsdf-epws-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize real-time service
realtimeService.initialize(io);

// Apply security middleware
securityMiddleware(app);

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://localhost:3000",
    "https://collaborative-playlist-manager.vercel.app",
    "https://collaborative-playlist-manager-frontend.vercel.app",
    "https://frontend-fmkzh7bw8-epws-projects.vercel.app",
    "https://frontend-hesppgsdf-epws-projects.vercel.app",
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
  console.log(`Server running on port ${PORT}`);
});
