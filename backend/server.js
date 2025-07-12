const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const http = require("http");
const securityMiddleware = require("./src/middleware/security");
const { handleProcessErrors } = require("./src/middleware/errorHandler");
const connectDB = require("./src/config/database");
require("dotenv").config();

// Set up process-level error handling
handleProcessErrors();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  },
});

// Apply security middleware
securityMiddleware(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
connectDB();

// Socket.io for real-time updates
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join-playlist", (playlistId) => {
    socket.join(`playlist-${playlistId}`);
  });

  socket.on("leave-playlist", (playlistId) => {
    socket.leave(`playlist-${playlistId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Make io accessible to routes
app.set("io", io);

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
