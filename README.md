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
│   │   ├── controllers/  - Business logic
│   │   ├── models/       - Database models
│   │   ├── routes/       - API routes
│   │   ├── services/     - External services
│   │   ├── middleware/   - Express middleware
│   │   ├── utils/        - Helper functions
│   │   └── config/       - Configuration files
│   ├── package.json      - Dependencies
│   └── server.js         - Express server setup
└── README.md
```

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

- Auth
  - POST /api/auth/register - Register a new user
  - POST /api/auth/login - Login
  - GET /api/auth/me - Get current user

- Playlists
  - GET /api/playlists - Get all playlists
  - POST /api/playlists - Create a new playlist
  - GET /api/playlists/:id - Get a single playlist
  - PUT /api/playlists/:id - Update a playlist
  - DELETE /api/playlists/:id - Delete a playlist

- Songs
  - GET /api/songs - Get all songs
  - POST /api/songs - Add a song
  - DELETE /api/songs/:id - Remove a song

## License

[MIT](LICENSE)
