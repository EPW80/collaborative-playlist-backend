const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const http = require("http");
const securityMiddleware = require("./src/middleware/security");
require("dotenv").config();

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/collaborative-playlist",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

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

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/playlists", require("./src/routes/playlists"));
app.use("/api/songs", require("./src/routes/songs"));
app.use("/api/search", require("./src/routes/search"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
