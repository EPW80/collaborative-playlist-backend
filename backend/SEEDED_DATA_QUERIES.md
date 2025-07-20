# MongoDB Database Queries for Collaborative Playlist Manager

## Database Connection
```javascript
// Connect to MongoDB
const mongoose = require('mongoose');
await mongoose.connect('mongodb://localhost:27017/collaborative-playlist');
```

## Sample MongoDB Queries for Seeded Data

### 1. Users Collection Queries

```javascript
// Get all users with their preferences
db.users.find().pretty()

// Find user by email
db.users.findOne({"email": "demo@example.com"})

// Count total users
db.users.countDocuments()

// Find users created in the last week
db.users.find({
  "createdAt": {
    "$gte": new Date("2025-07-12T00:00:00.000Z")
  }
}).sort({"createdAt": -1})
```

### 2. Playlists Collection Queries

```javascript
// Get all playlists with creator info
db.playlists.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "creator",
      foreignField: "_id",
      as: "creatorInfo"
    }
  },
  {
    $project: {
      name: 1,
      description: 1,
      isPublic: 1,
      songCount: { $size: "$songs" },
      "creatorInfo.username": 1,
      "creatorInfo.email": 1,
      createdAt: 1
    }
  }
])

// Find public playlists
db.playlists.find({"isPublic": true})

// Find playlists by creator
db.playlists.find({
  "creator": ObjectId("687c265410747c78203127a3")
})

// Count playlists per user
db.playlists.aggregate([
  {
    $group: {
      _id: "$creator",
      playlistCount: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  }
])
```

### 3. Songs Collection Queries

```javascript
// Get all songs with playlist and user info
db.songs.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "addedBy",
      foreignField: "_id",
      as: "addedByUser"
    }
  },
  {
    $lookup: {
      from: "playlists",
      localField: "playlist",
      foreignField: "_id",
      as: "playlistInfo"
    }
  },
  {
    $project: {
      title: 1,
      artist: 1,
      album: 1,
      duration: 1,
      "addedByUser.username": 1,
      "playlistInfo.name": 1,
      addedAt: 1
    }
  }
])

// Find songs by artist
db.songs.find({"artist": "Queen"})

// Find songs in a specific playlist
db.songs.find({
  "playlist": ObjectId("6871e530e4ccfaa999f812d8")
}).sort({"order": 1})

// Get song statistics
db.songs.aggregate([
  {
    $group: {
      _id: "$artist",
      songCount: { $sum: 1 },
      totalDuration: { $sum: "$duration" }
    }
  },
  {
    $sort: { songCount: -1 }
  }
])
```

### 4. Complex Relationship Queries

```javascript
// Get user's complete playlist data
db.users.aggregate([
  {
    $match: { "username": "testuser_updated" }
  },
  {
    $lookup: {
      from: "playlists",
      localField: "_id",
      foreignField: "creator",
      as: "createdPlaylists"
    }
  },
  {
    $lookup: {
      from: "songs",
      localField: "_id",
      foreignField: "addedBy",
      as: "addedSongs"
    }
  },
  {
    $project: {
      username: 1,
      email: 1,
      playlistCount: { $size: "$createdPlaylists" },
      songsAdded: { $size: "$addedSongs" },
      createdAt: 1
    }
  }
])

// Find most popular playlists (by song count)
db.playlists.aggregate([
  {
    $addFields: {
      songCount: { $size: "$songs" }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "creator",
      foreignField: "_id",
      as: "creator"
    }
  },
  {
    $sort: { songCount: -1 }
  },
  {
    $project: {
      name: 1,
      songCount: 1,
      "creator.username": 1,
      isPublic: 1,
      createdAt: 1
    }
  }
])

// Find collaborative playlists (with collaborators)
db.playlists.find({
  "collaborators": { $exists: true, $not: { $size: 0 } }
})
```

### 5. Performance Index Queries

```javascript
// Show indexes on collections
db.users.getIndexes()
db.playlists.getIndexes()
db.songs.getIndexes()

// Query using indexes (optimized performance)
db.playlists.find({"creator": ObjectId("687c265410747c78203127a3")}).explain("executionStats")
db.songs.find({"playlist": ObjectId("6871e530e4ccfaa999f812d8")}).explain("executionStats")
```

## Current Seeded Data Summary

### Users (8 total)
- **demo_user** (demo@example.com) - Created: 2025-07-19
- **demo_user2** (demo2@example.com) - Created: 2025-07-19  
- **testuser_updated** (test@example.com) - Created: 2025-07-11
- Plus 5 additional test users

### Playlists (3 total)
- **"Postman Test Playlist"** by demo_user (0 songs, public)
- **"My Updated Test Playlist"** by testuser_updated (1 song, public) - 2 instances

### Songs (2 total)
- **"Bohemian Rhapsody"** by Queen (5:55) - in both test playlists
- Added by testuser_updated to "My Updated Test Playlist"

### Database Features Demonstrated
- ✅ User authentication and profiles
- ✅ Playlist creation and management
- ✅ Song metadata storage
- ✅ User-playlist relationships
- ✅ Song-playlist associations
- ✅ Public/private playlist controls
- ✅ Timestamps and audit trails
- ✅ Performance-optimized indexes
- ✅ Collaborative features structure (ready for expansion)
