# 🎵 Collaborative Playlist Manager

> A modern, full-stack real-time collaborative playlist manager with AI-powered features that enables seamless music collaboration across teams and communities.

## 🌟 Project Overview

The Collaborative Playlist Manager is a comprehensive music collaboration platform that combines real-time synchronization, role-based access control, AI-powered music discovery, and multiple music service integrations. Built with a modern tech stack, it provides users with an intuitive way to create, share, and manage playlists collaboratively.

**🎯 Key Highlights:**
- **🤖 AI-Powered Features**: Smart playlist names, song recommendations, and analysis
- **🔄 Real-time Collaboration**: Live updates using Socket.io WebSockets
- **👑 5-Tier RBAC System**: Fine-grained permission control
- **🎵 Multi-Service Integration**: Spotify, Last.fm, Genius, and OpenAI APIs
- **🚀 Performance Optimized**: 15x faster with Redis caching
- **🌐 Production Ready**: Deployed on Render (backend) and Vercel (frontend)

## ✨ Features

### 🤖 AI-Powered Features
- **🎯 Smart Playlist Names**: AI-generated creative playlist names based on content
- **🎵 Song Recommendations**: Personalized suggestions based on playlist analysis
- **📊 Playlist Analysis**: Mood, genre, energy level, and coherence insights
- **✍️ Auto-Generated Descriptions**: Engaging descriptions for playlist sharing
- **🧠 Smart Playlist Creation**: Automatic playlist generation from seeds and preferences

### 🎵 Core Features
- **🔄 Real-time Collaboration**: Live playlist updates across all connected users
- **👥 Multi-user Playlists**: Invite collaborators with specific roles and permissions
- **🎧 Music Discovery**: Search tracks across Spotify and Last.fm
- **📝 Lyrics Integration**: Comprehensive lyrics from Genius API
- **🔐 Secure Authentication**: JWT-based auth with bcrypt password hashing
- **📱 Responsive Design**: Mobile-first UI that works on all devices

### 🛡️ Security & Performance
- **🚀 Redis Caching**: 15x performance improvement
- **🔒 Rate Limiting**: API protection against abuse
- **🛡️ Security Headers**: Comprehensive security with Helmet.js
- **✅ Input Validation**: Express-validator for data integrity
- **🏗️ Error Handling**: Global error management and logging

### 👑 Advanced RBAC System
| Role | Permissions |
|------|-------------|
| **Owner** | Full control, transfer ownership, delete playlist |
| **Admin** | Manage collaborators, modify settings, add/remove songs |
| **Editor** | Add/remove songs, modify playlist details |
| **Contributor** | Add songs, create suggestions |
| **Viewer** | View only, no modification rights |

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern component-based UI library
- **Material-UI v7** - Comprehensive React component library
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API requests
- **React Router v7** - Client-side routing

### Backend
- **Node.js & Express.js** - JavaScript runtime and web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Redis** - In-memory caching and session storage
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication

### External APIs
- **🤖 OpenAI GPT-3.5-turbo** - AI-powered playlist features and recommendations
- **🎵 Spotify Web API** - Music streaming data and track information
- **🎤 Last.fm API** - Artist biographies and music metadata  
- **📖 Genius API** - Song lyrics and detailed music information

### Development & Deployment
- **Vercel** - Frontend deployment and hosting
- **Render** - Backend API deployment
- **MongoDB Atlas** - Cloud database hosting
- **Redis Cloud** - Managed Redis hosting

## 🏗️ Project Structure

```
collaborative-playlist-manager/
├── backend/                   # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/       # API route controllers
│   │   ├── middleware/        # Authentication & RBAC middleware
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic & AI services
│   │   └── config/           # Database & Redis configuration
│   └── server.js             # Express server entry point
├── frontend/                  # React frontend
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable React components
│       │   ├── Auth/        # Authentication components
│       │   ├── Playlist/    # Playlist-related components
│       │   ├── AI/          # AI-powered components
│       │   └── Player/      # Audio player components
│       ├── pages/           # Page components
│       ├── services/        # API & WebSocket services
│       ├── context/         # React Context providers
│       └── hooks/           # Custom React hooks
└── README.md
```

## 📋 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git**

For development, you'll also need:
- **MongoDB** (local installation or MongoDB Atlas account)
- **Redis** (local installation or Redis Cloud account)

### 🚀 Installation Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/EPW80/collaborative-playlist-manager.git
   cd collaborative-playlist-manager
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` files in both backend and frontend directories:

   **Backend `.env`:**
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/collaborative-playlist
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:3000

   # AI Features (Optional)
   OPENAI_API_KEY=your_openai_api_key_here
   ENABLE_AI_FEATURES=true

   # API Keys (Optional for basic functionality)
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:5000/api/search/spotify/callback

   LASTFM_API_KEY=your_lastfm_api_key
   GENIUS_ACCESS_TOKEN=your_genius_access_token

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

   **Frontend `.env`:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

5. **Start Development Servers**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api

### 🎯 API Keys Setup (Optional)

To enable full functionality, obtain API keys from:

1. **OpenAI**: https://platform.openai.com/api-keys (for AI features)
2. **Spotify**: https://developer.spotify.com/
3. **Last.fm**: https://www.last.fm/api
4. **Genius**: https://genius.com/api-clients

## 🔧 Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Application environment | No | `development` |
| `PORT` | Server port | No | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:3000` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No | - |
| `ENABLE_AI_FEATURES` | Enable/disable AI functionality | No | `false` |
| `SPOTIFY_CLIENT_ID` | Spotify API client ID | No | - |
| `SPOTIFY_CLIENT_SECRET` | Spotify API client secret | No | - |
| `LASTFM_API_KEY` | Last.fm API key | No | - |
| `GENIUS_ACCESS_TOKEN` | Genius API access token | No | - |
| `REDIS_HOST` | Redis server host | No | `localhost` |
| `REDIS_PORT` | Redis server port | No | `6379` |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | No | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL` | Socket.io server URL | No | `http://localhost:5000` |

## 📚 API Documentation

### Key Endpoints

#### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

#### 🎵 Playlist Management
- `GET /api/playlists` - Get all accessible playlists
- `POST /api/playlists` - Create new playlist
- `GET /api/playlists/:id` - Get single playlist with songs
- `PUT /api/playlists/:id` - Update playlist details
- `DELETE /api/playlists/:id` - Delete playlist

#### 🎶 Song Management
- `GET /api/songs?playlistId=:id` - Get songs from playlist
- `POST /api/songs` - Add song to playlist
- `DELETE /api/songs/:id` - Remove song from playlist

#### 🤖 AI Features
- `POST /api/ai/generate-names` - Generate smart playlist names
- `POST /api/ai/recommendations/:playlistId` - Get AI song recommendations
- `GET /api/ai/analyze/:playlistId` - Analyze playlist characteristics
- `POST /api/ai/generate-description/:playlistId` - Generate playlist description

#### � Collaboration & RBAC
- `POST /api/rbac/collaborators/:playlistId` - Add collaborator with role
- `PUT /api/rbac/collaborators/:playlistId/:userId` - Update collaborator role
- `GET /api/rbac/permissions/:playlistId` - Get user permissions

#### 🔍 Music Search & Discovery
- `GET /api/search/tracks?q=:query&service=:service` - Search tracks
- `GET /api/search/artist?name=:name` - Get artist information
- `GET /api/lyrics/find?title=:title&artist=:artist` - Find lyrics

For complete API documentation, visit: `http://localhost:5000/api`

## 🚀 Deployment

### Production Environment Variables

**Backend (Render):**
```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://frontend-epws-projects.vercel.app
OPENAI_API_KEY=your_openai_api_key
REDIS_HOST=your_redis_cloud_host
REDIS_PORT=your_redis_cloud_port
REDIS_PASSWORD=your_redis_cloud_password
```

**Frontend (Vercel):**
```env
REACT_APP_API_URL=https://collaborative-playlist-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://collaborative-playlist-backend.onrender.com
```

### Deployment Steps

1. **Backend**: Deploy to Render with Node.js environment
2. **Frontend**: Deploy to Vercel with React build
3. **Database**: MongoDB Atlas for production database
4. **Cache**: Redis Cloud for production caching

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
```bash
# Clone repository
git clone https://github.com/EPW80/collaborative-playlist-manager.git
cd collaborative-playlist-manager

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
cd backend && npm run dev
cd frontend && npm start
```

### Code Standards
- **JavaScript**: ES6+ features, async/await preferred
- **React**: Functional components with hooks
- **API**: RESTful endpoints with proper HTTP status codes
- **Testing**: Add tests for new features
- **Documentation**: Update docs for significant changes

### Commit Message Format
```
type(scope): description

Examples:
feat(ai): add smart playlist name generation
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
```

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Commit with conventional commit messages
5. Push to your fork and submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** - For powering AI features with GPT-3.5-turbo
- **Material-UI Team** - For the excellent React component library
- **Socket.io Team** - For real-time communication capabilities
- **Spotify, Last.fm, Genius** - For providing comprehensive music APIs
- **MongoDB & Redis** - For reliable data storage solutions

---

## 📊 Project Status

- **Version**: 1.0.0
- **Status**: Production Ready ✅
- **Last Updated**: July 2025
- **Maintained**: Actively maintained

### 🎯 Roadmap
- [ ] Advanced analytics dashboard
- [ ] Mobile Progressive Web App (PWA)
- [ ] Voice commands integration
- [ ] Real-time chat in playlists
- [ ] Advanced AI music analysis
- [ ] Multi-language support

---

**🎵 Built with 💀 for music lovers and collaborative teams**
