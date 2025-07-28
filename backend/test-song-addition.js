require("dotenv").config();
const mongoose = require("mongoose");

async function testSongAddition() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const User = require("./src/models/User");
    const Playlist = require("./src/models/Playlist");
    const Song = require("./src/models/Song");
    const rbacService = require("./src/services/rbacService");

    // Find debug admin user
    const user = await User.findOne({ email: "debug_admin@example.com" });
    const playlist = await Playlist.findById("687f2917cfab201323084ab4");

    console.log("👤 User:", user.username);
    console.log("📋 Playlist:", playlist.name);

    // Check permissions
    const userRole = rbacService.getUserRole(user._id.toString(), playlist);
    const canAddSongs = rbacService.hasPermission(user._id.toString(), playlist, "canAddSongs");

    console.log("🔑 User role:", userRole);
    console.log("🎵 Can add songs:", canAddSongs);

    if (canAddSongs) {
      console.log("\n🧪 Testing song addition...");
      
      // Simulate song addition (same logic as controller)
      const songData = {
        title: "Test API Song",
        artist: "API Test Artist", 
        album: "Test Album",
        duration: 210,
        spotifyId: "test_api_song_id"
      };

      // Check for duplicates
      const existingSong = await Song.findOne({
        playlist: playlist._id,
        title: songData.title,
        artist: songData.artist,
      });

      if (existingSong) {
        console.log("⏭️ Song already exists, skipping creation");
      } else {
        // Get next order
        const lastSong = await Song.findOne({ playlist: playlist._id }).sort({ order: -1 });
        const nextOrder = lastSong ? lastSong.order + 1 : 0;

        // Create song
        const newSong = new Song({
          ...songData,
          addedBy: user._id,
          playlist: playlist._id,
          order: nextOrder,
        });

        const savedSong = await newSong.save();

        // Add to playlist
        playlist.songs.push(savedSong._id);
        playlist.updatedAt = Date.now();
        await playlist.save();

        console.log("✅ Song added successfully:", savedSong.title);
      }

      // Check final song count
      const songCount = await Song.countDocuments({ playlist: playlist._id });
      console.log("📊 Total songs in playlist:", songCount);
    } else {
      console.log("❌ User cannot add songs. Current role:", userRole);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testSongAddition();
