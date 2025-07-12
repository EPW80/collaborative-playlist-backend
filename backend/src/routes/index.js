/**
 * Routes Index File
 * Central place to configure all API routes
 */

const authRoutes = require('./auth');
const playlistRoutes = require('./playlists');
const songRoutes = require('./songs');
const searchRoutes = require('./search');

module.exports = (app) => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/songs', songRoutes);
  app.use('/api/search', searchRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      success: true,
      message: 'Collaborative Playlist Manager API is running',
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: require('../../package.json').version,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'Collaborative Playlist Manager API',
      data: {
        version: require('../../package.json').version,
        endpoints: {
          auth: {
            'POST /api/auth/register': 'Register a new user',
            'POST /api/auth/login': 'Login user',
            'GET /api/auth/me': 'Get current user',
            'PUT /api/auth/profile': 'Update user profile',
            'PUT /api/auth/password': 'Change password',
            'DELETE /api/auth/account': 'Delete account'
          },
          playlists: {
            'GET /api/playlists': 'Get all playlists',
            'POST /api/playlists': 'Create a playlist',
            'GET /api/playlists/:id': 'Get playlist by ID',
            'PUT /api/playlists/:id': 'Update playlist',
            'DELETE /api/playlists/:id': 'Delete playlist',
            'POST /api/playlists/:id/collaborators': 'Add collaborator',
            'DELETE /api/playlists/:id/collaborators/:userId': 'Remove collaborator'
          },
          songs: {
            'GET /api/songs?playlistId=:id': 'Get songs from playlist',
            'POST /api/songs': 'Add song to playlist',
            'DELETE /api/songs/:id?playlistId=:id': 'Remove song from playlist',
            'GET /api/songs/search?playlistId=:id&q=:query': 'Search songs in playlist',
            'PUT /api/songs/reorder': 'Reorder songs in playlist'
          },
          search: {
            'GET /api/search/tracks?q=:query': 'Search tracks (Spotify/Last.fm)',
            'GET /api/search/artist?name=:name': 'Get artist info',
            'GET /api/search/spotify/auth': 'Get Spotify auth URL',
            'GET /api/search/spotify/callback': 'Spotify OAuth callback'
          }
        }
      }
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  });
};
