const config = {
  development: {
    port: process.env.PORT || 5000,
    mongoUri:
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/collaborative-playlist",
    jwtSecret: process.env.JWT_SECRET || "dev-secret-key-change-in-production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri:
        process.env.SPOTIFY_REDIRECT_URI ||
        "http://localhost:5000/api/search/spotify/callback",
    },
    lastfm: {
      apiKey: process.env.LASTFM_API_KEY,
    },
  },
  production: {
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    },
    lastfm: {
      apiKey: process.env.LASTFM_API_KEY,
    },
  },
  test: {
    port: process.env.PORT || 5001,
    mongoUri:
      process.env.MONGODB_TEST_URI ||
      "mongodb://localhost:27017/collaborative-playlist-test",
    jwtSecret: process.env.JWT_SECRET || "test-secret-key",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    },
    lastfm: {
      apiKey: process.env.LASTFM_API_KEY,
    },
  },
};

const env = process.env.NODE_ENV || "development";

module.exports = config[env];
