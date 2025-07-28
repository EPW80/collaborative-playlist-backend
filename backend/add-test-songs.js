require("dotenv").config();
const mongoose = require("mongoose");

async function addTestSongs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const Song = require("./src/models/Song");
    const Playlist = require("./src/models/Playlist");
    const User = require("./src/models/User");

    // Check current songs
    const songCount = await Song.countDocuments();
    console.log("🎵 Current songs in database:", songCount);

    // Find the test playlist
    const playlist = await Playlist.findById("687f2917cfab201323084ab4");
    if (!playlist) {
      console.log("❌ Test playlist not found");
      return;
    }
    console.log("📋 Found playlist:", playlist.name);

    // Find debug admin user
    const user = await User.findOne({ email: "debug_admin@example.com" });
    if (!user) {
      console.log("❌ Debug admin user not found");
      return;
    }
    console.log("👤 Found user:", user.username);

    // Check if user has access to playlist
    const isCreator = playlist.creator.toString() === user._id.toString();
    const isCollaborator = playlist.collaborators.some(
      (collab) => collab.user.toString() === user._id.toString()
    );

    console.log("🔑 Access check:");
    console.log("- Is creator:", isCreator);
    console.log("- Is collaborator:", isCollaborator);
    console.log("- Playlist is public:", playlist.isPublic);

    if (!isCreator && !isCollaborator && !playlist.isPublic) {
      console.log("⚠️ User doesn't have access to this playlist");
      // Let's make the user a collaborator
      playlist.collaborators.push({
        user: user._id,
        role: "editor",
        addedAt: Date.now()
      });
      await playlist.save();
      console.log("✅ Added debug admin as collaborator");
    }

    // Add test songs
    const testSongs = [
      {
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 355,
        spotifyId: "test_bohemian_rhapsody",
      },
      {
        title: "Hotel California",
        artist: "Eagles",
        album: "Hotel California",
        duration: 391,
        spotifyId: "test_hotel_california",
      },
      {
        title: "Stairway to Heaven",
        artist: "Led Zeppelin",
        album: "Led Zeppelin IV",
        duration: 482,
        spotifyId: "test_stairway_heaven",
      },
    ];

    console.log("\n🎵 Adding test songs...");
    let songsAdded = 0;

    for (let i = 0; i < testSongs.length; i++) {
      const songData = testSongs[i];
      
      // Check if song already exists
      const existingSong = await Song.findOne({
        playlist: playlist._id,
        title: songData.title,
        artist: songData.artist,
      });

      if (existingSong) {
        console.log(`⏭️  Skipping "${songData.title}" - already exists`);
        continue;
      }

      const newSong = new Song({
        ...songData,
        addedBy: user._id,
        playlist: playlist._id,
        order: i,
      });

      const savedSong = await newSong.save();
      
      // Add song reference to playlist
      playlist.songs.push(savedSong._id);
      songsAdded++;
      
      console.log(`✅ Added: "${songData.title}" by ${songData.artist}`);
    }

    if (songsAdded > 0) {
      playlist.updatedAt = Date.now();
      await playlist.save();
      console.log(`\n🎉 Successfully added ${songsAdded} songs to playlist!`);
    } else {
      console.log("\n📝 No new songs added (all already exist)");
    }

    // Final check
    const finalSongCount = await Song.countDocuments();
    const updatedPlaylist = await Playlist.findById(playlist._id).populate("songs");
    
    console.log("\n📊 Final status:");
    console.log("- Total songs in database:", finalSongCount);
    console.log("- Songs in this playlist:", updatedPlaylist.songs.length);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

addTestSongs();
