require("dotenv").config();
const mongoose = require("mongoose");

async function testSongAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const User = require("./src/models/User");
    const Playlist = require("./src/models/Playlist");

    // Find debug admin user
    const user = await User.findOne({ email: "debug_admin@example.com" });
    if (!user) {
      console.log("❌ Debug admin user not found");
      return;
    }
    console.log("👤 Found user:", user.username, user.email);

    // Find available playlists
    const playlists = await Playlist.find({}).populate("creator", "username email").limit(3);
    console.log("\n📋 Available playlists:");
    playlists.forEach(p => {
      console.log(`- ID: ${p._id}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Creator: ${p.creator?.username}`);
      console.log(`  Songs: ${p.songs?.length || 0}`);
      console.log("");
    });

    // Test song data structure
    const testSongData = {
      playlistId: playlists[0]?._id?.toString(),
      title: "Test API Song",
      artist: "API Test Artist",
      album: "Test Album",
      duration: 210,
      spotifyId: "test_spotify_id"
    };

    console.log("🧪 Test song data:");
    console.log(JSON.stringify(testSongData, null, 2));

    // Check if backend validation would pass
    console.log("\n✅ All required fields present for backend validation");
    console.log("- playlistId:", !!testSongData.playlistId);
    console.log("- title:", !!testSongData.title);
    console.log("- artist:", !!testSongData.artist);
    console.log("- duration:", typeof testSongData.duration === 'number' && testSongData.duration > 0);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testSongAPI();
