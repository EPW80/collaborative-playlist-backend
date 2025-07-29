const config = {
  development: {
    port: process.env.PORT || 5000,
    mongoUri:
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/collaborative-playlist",
    jwtSecret: process.env.JWT_SECRET || "dev-secret-key-change-in-production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    redis: {
      enabled: process.env.REDIS_OPTIONAL !== 'true',
      required: process.env.REDIS_REQUIRED === 'true', // New flag for production
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    },
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
    genius: {
      accessToken: process.env.GENIUS_ACCESS_TOKEN,
    },
  },
  production: {
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
    redis: {
      enabled: process.env.REDIS_OPTIONAL !== 'true',
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
    },
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    },
    lastfm: {
      apiKey: process.env.LASTFM_API_KEY,
    },
    genius: {
      accessToken: process.env.GENIUS_ACCESS_TOKEN,
    },
  },
  test: {
    port: process.env.PORT || 5001,
    mongoUri:
      process.env.MONGODB_TEST_URI ||
      "mongodb://localhost:27017/collaborative-playlist-test",
    jwtSecret: process.env.JWT_SECRET || "test-secret-key",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_TEST_DB || 1, // Use different DB for tests
    },
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    },
    lastfm: {
      apiKey: process.env.LASTFM_API_KEY,
    },
    genius: {
      accessToken: process.env.GENIUS_ACCESS_TOKEN,
    },
  },
};

const env = process.env.NODE_ENV || "development";

module.exports = config[env];
