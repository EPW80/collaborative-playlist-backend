# Collaborative Playlist Manager

A real-time collaborative playlist manager application that allows users to create, share, and edit playlists together.

## Features

- User authentication
- Create and manage playlists
- Add and remove songs from playlists
- Real-time updates using Socket.io
- Collaborative editing of playlists

## Project Structure

```
backend/
│   ├── src/
│   │   ├── controllers/      - Business logic (MVC pattern)
│   │   │   ├── auth.controller.js      - Authentication logic
│   │   │   ├── playlist.controller.js  - Playlist management
│   │   │   ├── song.controller.js      - Song management
│   │   │   └── index.js               - Controller exports
│   │   ├── models/           - Database models (Mongoose)
│   │   │   ├── User.js                - User schema
│   │   │   ├── Playlist.js            - Playlist schema
│   │   │   └── Song.js                - Song schema
│   │   ├── routes/           - API routes (Express Router)
│   │   │   ├── auth.js                - Auth endpoints
│   │   │   ├── playlists.js           - Playlist endpoints
│   │   │   ├── songs.js               - Song endpoints
│   │   │   ├── search.js              - Music search endpoints
│   │   │   └── index.js               - Route configuration
│   │   ├── services/         - External services
│   │   │   ├── spotifyService.js      - Spotify API integration
│   │   │   └── lastfmService.js       - Last.fm API integration
│   │   ├── middleware/       - Express middleware
│   │   │   ├── auth.js                - JWT authentication
│   │   │   ├── security.js            - Security headers & rate limiting
│   │   │   └── rateLimiter.js         - Rate limiting configuration
│   │   ├── utils/            - Helper functions
│   │   │   ├── errorHandler.js        - Error handling utilities
│   │   │   └── dataConsistency.js     - Data validation tools
│   │   └── config/           - Configuration files
│   │       └── index.js               - Environment configuration
│   ├── package.json          - Dependencies
│   ├── server.js             - Express server setup
│   ├── test-api.sh           - API testing script
│   └── .env                  - Environment variables
└── README.md
```

## MVC Architecture

The application follows the **Model-View-Controller (MVC)** pattern:

- **Models** (`src/models/`): Database schemas and data logic
- **Controllers** (`src/controllers/`): Business logic and request handling  
- **Routes** (`src/routes/`): HTTP endpoints and request routing
- **Middleware** (`src/middleware/`): Request processing and authentication
- **Services** (`src/services/`): External API integrations

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   ```

2. Install dependencies
   ```
   cd collaborative-playlist-manager/backend
   npm install
   ```

3. Create a .env file in the backend directory
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the development server
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `DELETE /api/auth/account` - Delete user account

### Playlists
- `GET /api/playlists` - Get all accessible playlists
- `POST /api/playlists` - Create a new playlist
- `GET /api/playlists/:id` - Get a single playlist with songs
- `PUT /api/playlists/:id` - Update playlist details
- `DELETE /api/playlists/:id` - Delete a playlist
- `POST /api/playlists/:id/collaborators` - Add collaborator
- `DELETE /api/playlists/:id/collaborators/:userId` - Remove collaborator

### Songs
- `GET /api/songs?playlistId=:id` - Get songs from a playlist
- `POST /api/songs` - Add a song to a playlist
- `DELETE /api/songs/:id?playlistId=:id` - Remove a song
- `GET /api/songs/search?playlistId=:id&q=:query` - Search songs in playlist
- `PUT /api/songs/reorder` - Reorder songs in playlist

### Music Search (External APIs)
- `GET /api/search/tracks?q=:query&service=:service` - Search tracks
- `GET /api/search/artist?name=:name` - Get artist information
- `GET /api/search/spotify/auth` - Get Spotify authorization URL
- `GET /api/search/spotify/callback` - Spotify OAuth callback

### Utility
- `GET /health` - Health check endpoint
- `GET /api` - API documentation and endpoint list

## License

[MIT](LICENSE)
