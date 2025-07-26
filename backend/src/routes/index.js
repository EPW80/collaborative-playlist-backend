/**
 * Routes Index File
 * Central place to configure all API routes
 */

const authRoutes = require("./auth");
const playlistRoutes = require("./playlists");
const songRoutes = require("./songs");
const searchRoutes = require("./search");
const cacheRoutes = require("./cache");
const lyricsRoutes = require("./lyrics");
const realtimeRoutes = require("./realtime");
const rbacRoutes = require("./rbac");
const suggestionsRoutes = require("./suggestions");

module.exports = (app) => {
  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/playlists", playlistRoutes);
  app.use("/api/songs", songRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/cache", cacheRoutes);
  app.use("/api/lyrics", lyricsRoutes);
  app.use("/api/realtime", realtimeRoutes);
  app.use("/api/rbac", rbacRoutes);
  app.use("/api/suggestions", suggestionsRoutes);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "Collaborative Playlist Manager API is running",
      data: {
        status: "OK",
        timestamp: new Date().toISOString(),
        version: require("../../package.json").version,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      },
    });
  });

  // API documentation endpoint
  app.get("/api", (req, res) => {
    res.json({
      success: true,
      message: "Collaborative Playlist Manager API",
      data: {
        version: require("../../package.json").version,
        endpoints: {
          auth: {
            "POST /api/auth/register": "Register a new user",
            "POST /api/auth/login": "Login user",
            "GET /api/auth/me": "Get current user",
            "PUT /api/auth/profile": "Update user profile",
            "PUT /api/auth/password": "Change password",
            "DELETE /api/auth/account": "Delete account",
          },
          playlists: {
            "GET /api/playlists": "Get all playlists",
            "POST /api/playlists": "Create a playlist",
            "GET /api/playlists/:id": "Get playlist by ID",
            "PUT /api/playlists/:id": "Update playlist",
            "DELETE /api/playlists/:id": "Delete playlist",
            "POST /api/playlists/:id/collaborators": "Add collaborator",
            "DELETE /api/playlists/:id/collaborators/:userId":
              "Remove collaborator",
          },
          songs: {
            "GET /api/songs?playlistId=:id": "Get songs from playlist",
            "POST /api/songs": "Add song to playlist",
            "DELETE /api/songs/:id?playlistId=:id": "Remove song from playlist",
            "GET /api/songs/search?playlistId=:id&q=:query":
              "Search songs in playlist",
            "PUT /api/songs/reorder": "Reorder songs in playlist",
          },
          search: {
            "GET /api/search/tracks?q=:query":
              "Search tracks (Spotify/Last.fm)",
            "GET /api/search/artist?name=:name": "Get artist info",
            "GET /api/search/spotify/auth": "Get Spotify auth URL",
            "GET /api/search/spotify/callback": "Spotify OAuth callback",
          },
          lyrics: {
            "GET /api/lyrics/health": "Check Genius API health",
            "GET /api/lyrics/search?q=:query": "Search songs on Genius",
            "GET /api/lyrics/song/:songId": "Get song details from Genius",
            "GET /api/lyrics/artist/:artistId": "Get artist info from Genius",
            "GET /api/lyrics/artist/:artistId/songs": "Get artist's songs",
            "GET /api/lyrics/find?title=:title&artist=:artist":
              "Find lyrics by title and artist",
            "GET /api/lyrics/trending": "Get trending songs from Genius",
            "POST /api/lyrics/enrich/:songId":
              "Add lyrics info to database song",
          },
          realtime: {
            "GET /api/realtime/session/:playlistId":
              "Get playlist session status",
            "POST /api/realtime/vote": "Vote on a song (upvote/downvote)",
            "POST /api/realtime/now-playing": "Update now playing status",
            "POST /api/realtime/notification": "Send real-time notification",
            "GET /api/realtime/votes/:songId": "Get song vote statistics",
            "GET /api/realtime/activity/:playlistId":
              "Get playlist activity feed",
            "POST /api/realtime/presence": "Update user presence/cursor",
            "GET /api/realtime/stats": "Get real-time system statistics",
          },
          rbac: {
            "GET /api/rbac/permissions/:playlistId":
              "Get user permissions for playlist",
            "POST /api/rbac/collaborators/:playlistId":
              "Add collaborator with role",
            "PUT /api/rbac/collaborators/:playlistId/:userId":
              "Update collaborator role",
            "DELETE /api/rbac/collaborators/:playlistId/:userId":
              "Remove collaborator",
            "GET /api/rbac/collaborators/:playlistId": "Get all collaborators",
            "GET /api/rbac/roles": "Get available roles and permissions",
            "POST /api/rbac/leave/:playlistId": "Leave playlist",
            "POST /api/rbac/transfer-ownership/:playlistId":
              "Transfer ownership",
          },
          suggestions: {
            "POST /api/suggestions/:playlistId": "Submit song suggestion",
            "GET /api/suggestions/:playlistId": "Get pending suggestions",
            "POST /api/suggestions/:playlistId/:suggestionId/approve":
              "Approve suggestion",
            "POST /api/suggestions/:playlistId/:suggestionId/reject":
              "Reject suggestion",
            "DELETE /api/suggestions/:playlistId/:suggestionId":
              "Delete suggestion",
            "GET /api/suggestions/my-suggestions/:playlistId":
              "Get my suggestions",
          },
        },
      },
    });
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      message: "API endpoint not found",
      path: req.originalUrl,
      method: req.method,
    });
  });
};
