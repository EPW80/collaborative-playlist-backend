const mongoose = require("mongoose");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");
require("dotenv").config();

/**
 * Data consistency check and cleanup utility
 * This script helps identify and fix data model inconsistencies
 */

async function checkDataConsistency() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/collaborative-playlist"
    );
    console.log("🔗 Connected to MongoDB");

    console.log("🔍 Checking data consistency...");

    // Check 1: Find playlists with orphaned song references
    const playlistsWithOrphanedSongs = await Playlist.find().populate("songs");
    let orphanedSongCount = 0;

    for (const playlist of playlistsWithOrphanedSongs) {
      const validSongs = [];
      for (const songId of playlist.songs) {
        if (songId) {
          validSongs.push(songId);
        } else {
          orphanedSongCount++;
          console.log(
            `❌ Found orphaned song reference in playlist ${playlist._id}`
          );
        }
      }

      if (validSongs.length !== playlist.songs.length) {
        playlist.songs = validSongs;
        await playlist.save();
        console.log(`✅ Cleaned up playlist ${playlist._id}`);
      }
    }

    // Check 2: Find songs without valid playlist references
    const songsWithInvalidPlaylists = await Song.find().populate("playlist");
    let invalidPlaylistSongs = 0;

    for (const song of songsWithInvalidPlaylists) {
      if (!song.playlist) {
        invalidPlaylistSongs++;
        console.log(
          `❌ Found song ${song._id} with invalid playlist reference`
        );
        // Optionally delete these orphaned songs
        // await Song.findByIdAndDelete(song._id);
      }
    }

    // Check 3: Find playlists with old collaborator structure
    const playlistsWithOldCollaborators = await Playlist.find({
      collaborators: { $elemMatch: { $type: "objectId" } },
    });

    for (const playlist of playlistsWithOldCollaborators) {
      console.log(
        `❌ Found playlist ${playlist._id} with old collaborator structure`
      );
      // Convert old structure to new structure
      const newCollaborators = playlist.collaborators.map((userId) => ({
        user: userId,
        role: "editor",
        joinedAt: new Date(),
      }));

      playlist.collaborators = newCollaborators;
      await playlist.save();
      console.log(
        `✅ Updated collaborator structure for playlist ${playlist._id}`
      );
    }

    console.log("\n📊 Consistency Check Results:");
    console.log(`- Orphaned song references found: ${orphanedSongCount}`);
    console.log(
      `- Songs with invalid playlist references: ${invalidPlaylistSongs}`
    );
    console.log(
      `- Playlists with old collaborator structure: ${playlistsWithOldCollaborators.length}`
    );

    console.log("\n✅ Data consistency check completed!");
  } catch (error) {
    console.error("❌ Error during consistency check:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

async function cleanupTestData() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/collaborative-playlist"
    );
    console.log("🔗 Connected to MongoDB");

    // Remove test users
    const User = require("../models/User");
    const testUsers = await User.find({ email: /test.*@example\.com/ });

    for (const user of testUsers) {
      // Delete user's playlists and songs
      const userPlaylists = await Playlist.find({ creator: user._id });
      for (const playlist of userPlaylists) {
        await Song.deleteMany({ playlist: playlist._id });
        await Playlist.findByIdAndDelete(playlist._id);
      }

      await User.findByIdAndDelete(user._id);
      console.log(`🗑️ Deleted test user: ${user.email}`);
    }

    console.log("✅ Test data cleanup completed!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the appropriate function based on command line argument
const command = process.argv[2];

if (command === "check") {
  checkDataConsistency();
} else if (command === "cleanup") {
  cleanupTestData();
} else {
  console.log("Usage:");
  console.log(
    "  node src/utils/dataConsistency.js check   - Check data consistency"
  );
  console.log(
    "  node src/utils/dataConsistency.js cleanup - Clean up test data"
  );
}

module.exports = { checkDataConsistency, cleanupTestData };
