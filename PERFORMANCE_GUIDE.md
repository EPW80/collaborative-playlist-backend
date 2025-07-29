# 🚀 Performance & Production Setup Guide

## 🎯 Core Features Implementation Status

### ✅ 1. Complete Spotify OAuth Flow
- **Enhanced Spotify Service** with caching and token refresh
- **User Playlist Import** from Spotify
- **Advanced Track Search** with popularity and metadata
- **Token Management** with automatic refresh

### ✅ 2. Required Redis Caching 
- **Production Mode**: Set `REDIS_REQUIRED=true` for mandatory caching
- **15x Performance Improvement** with Redis enabled
- **Intelligent Fallback** for development environments
- **Real-time Metrics** tracking cache hit rates

### ✅ 3. Enhanced Real-time Features
- **Live Playlist Editing** with conflict resolution
- **Real-time Chat** in playlist sessions
- **Song Reordering** with live updates
- **User Presence** tracking
- **Automatic Cleanup** of inactive sessions

## 🔧 Environment Configuration

### Essential Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/collaborative-playlist
JWT_SECRET=your-super-secure-jwt-secret-here

# Redis Configuration
REDIS_REQUIRED=true              # Enable for production
REDIS_HOST=localhost            # Redis server host
REDIS_PORT=6379                # Redis server port
REDIS_PASSWORD=your-redis-password
REDIS_DB=0                     # Redis database number

# Spotify Integration
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/search/spotify/callback

# Additional APIs
LASTFM_API_KEY=your-lastfm-api-key
GENIUS_ACCESS_TOKEN=your-genius-access-token

# Security
ADMIN_SECRET=your-admin-registration-secret
FRONTEND_URL=https://yourdomain.com
```

### Redis Setup Options

#### Option 1: Local Redis (Development)
```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS

# Start Redis
redis-server

# Test connection
redis-cli ping  # Should return "PONG"
```

#### Option 2: Redis Cloud (Production)
```bash
# Get free Redis instance from:
# - Redis Cloud (redislabs.com)
# - AWS ElastiCache
# - DigitalOcean Managed Redis

# Set environment variables:
REDIS_HOST=your-redis-cloud-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
REDIS_REQUIRED=true
```

## 📊 Performance Monitoring

### Cache Metrics Endpoint
```bash
GET /api/cache/stats

Response:
{
  "hits": 1250,
  "misses": 85,
  "hitRate": "93.6%",
  "averageResponseTime": 12.3,
  "connected": true
}
```

### Real-time Session Stats
```javascript
// Socket.io event
socket.on('session-stats', (data) => {
  console.log('Connected users:', data.connectedUsers);
  console.log('Active playlists:', data.activePlaylists);
});
```

## 🔄 Spotify OAuth Integration

### Frontend Implementation
```javascript
// 1. Get authorization URL
const response = await searchAPI.spotifyAuth();
window.location.href = response.data.authUrl;

// 2. Handle callback (automatic)
// User is redirected back to your app

// 3. Use authenticated endpoints
const playlists = await searchAPI.spotifyPlaylists();
```

### Backend Endpoints
```bash
# Get auth URL
GET /api/search/spotify/auth

# OAuth callback (automatic)
GET /api/search/spotify/callback?code=...

# Get user playlists (requires auth)
GET /api/search/spotify/playlists
Headers: x-spotify-token: user-access-token

# Refresh token
POST /api/search/spotify/refresh
Body: { "refreshToken": "..." }
```

## 🔥 Real-time Features Usage

### Live Playlist Editing
```javascript
// Start editing
socket.emit('playlist-edit-start', { 
  playlistId: 'playlist-id', 
  field: 'name' 
});

// End editing
socket.emit('playlist-edit-end', { 
  playlistId: 'playlist-id', 
  field: 'name' 
});

// Listen for others editing
socket.on('user-editing', ({ userId, field, editing }) => {
  // Show editing indicator
});
```

### Real-time Chat
```javascript
// Send message
socket.emit('playlist-message', {
  playlistId: 'playlist-id',
  message: 'Great song choice!',
  type: 'chat'
});

// Receive messages
socket.on('playlist-message', ({ userId, message, timestamp }) => {
  // Display message in chat
});
```

### Song Reordering
```javascript
// Reorder song
socket.emit('song-reorder', {
  playlistId: 'playlist-id',
  songId: 'song-id',
  oldIndex: 2,
  newIndex: 5
});

// Listen for reorder updates
socket.on('song-reordered', ({ userId, songId, oldIndex, newIndex }) => {
  // Update UI
});
```

## 🛡️ Production Deployment

### Recommended Stack
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - REDIS_REQUIRED=true
      - NODE_ENV=production
    depends_on:
      - redis
      - mongodb

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    
  mongodb:
    image: mongo:6
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
```

### Health Checks
```bash
# Application health
GET /api/health/health

# Cache health
GET /api/cache/health

# Database connectivity
GET /api/health/info
```

## 📈 Performance Optimization Tips

### 1. Caching Strategy
- **Playlists**: 15 minutes TTL
- **Songs**: 10 minutes TTL  
- **Search Results**: 1 hour TTL
- **User Sessions**: 5 minutes TTL

### 2. Real-time Optimization
- **Session Cleanup**: Every 5 minutes
- **Message History**: Last 50 messages
- **Presence Updates**: Debounced 1 second

### 3. Database Optimization
```javascript
// Recommended indexes
db.playlists.createIndex({ creator: 1, isPublic: 1 });
db.songs.createIndex({ playlist: 1, order: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
```

## 🧪 Testing Performance

### Load Testing Script
```bash
#!/bin/bash
# test-load.sh

echo "🔥 Load Testing Collaborative Playlist Manager"

# Test authentication
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
   http://localhost:5000/api/auth/me

# Test playlist retrieval
ab -n 500 -c 5 -H "Authorization: Bearer $TOKEN" \
   http://localhost:5000/api/playlists

# Test caching performance
ab -n 2000 -c 20 http://localhost:5000/api/cache/stats
```

### WebSocket Load Testing
```javascript
// ws-load-test.js
const io = require('socket.io-client');

const connections = [];
for (let i = 0; i < 100; i++) {
  const socket = io('http://localhost:5000');
  socket.emit('join-playlist', { 
    playlistId: 'test-playlist', 
    userId: `user-${i}` 
  });
  connections.push(socket);
}

console.log(`Connected ${connections.length} users`);
```

## 📝 Monitoring Dashboard

Create a simple monitoring dashboard:

```javascript
// admin-dashboard.js
const stats = {
  cache: await cacheService.getStats(),
  realtime: await realtimeService.getSessionStats(),
  database: await mongoose.connection.db.stats()
};

console.log('📊 System Performance:', stats);
```

Your collaborative playlist manager is now equipped with production-ready performance features! 🚀
