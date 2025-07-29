const mongoose = require("mongoose");
const Song = require("../models/Song");

/**
 * Fix spotifyId unique constraint issue
 * Remove global unique constraint and add playlist-scoped constraint
 */
async function fixSpotifyIndex() {
  try {
    console.log("🔧 Starting Spotify ID index migration...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/collaborative-playlist"
    );
    console.log("🔗 Connected to MongoDB");

    // Get the Song collection
    const collection = mongoose.connection.db.collection("songs");

    // List existing indexes
    console.log("📋 Current indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the global unique spotifyId index if it exists
    try {
      // Try multiple possible index names
      const possibleIndexNames = ["spotifyId_1", "spotifyId"];
      let dropped = false;
      
      for (const indexName of possibleIndexNames) {
        try {
          await collection.dropIndex(indexName);
          console.log(`✅ Dropped global unique index: ${indexName}`);
          dropped = true;
          break;
        } catch (error) {
          if (error.code === 27 || error.codeName === "IndexNotFound") {
            // Index doesn't exist, continue trying other names
            continue;
          } else {
            console.error(`❌ Error dropping index ${indexName}:`, error.message);
          }
        }
      }
      
      if (!dropped) {
        console.log("ℹ️  No global spotifyId index found to drop");
      }
    } catch (error) {
      console.error("❌ General error in index dropping:", error.message);
    }

    // Create the new compound unique index (playlist + spotifyId)
    try {
      const indexName = "playlist_spotifyId_unique";
      
      // Check if the index already exists
      const existingIndexes = await collection.indexes();
      const indexExists = existingIndexes.some(idx => idx.name === indexName);
      
      if (indexExists) {
        console.log(`ℹ️  Compound index ${indexName} already exists`);
      } else {
        await collection.createIndex(
          { playlist: 1, spotifyId: 1 },
          { 
            unique: true, 
            sparse: true,
            name: indexName
          }
        );
        console.log(`✅ Created compound unique index: ${indexName}`);
      }
    } catch (error) {
      if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
        console.log("ℹ️  Compound index already exists with different options");
        // Try to drop and recreate
        try {
          await collection.dropIndex("playlist_spotifyId_unique");
          await collection.createIndex(
            { playlist: 1, spotifyId: 1 },
            { 
              unique: true, 
              sparse: true,
              name: "playlist_spotifyId_unique"
            }
          );
          console.log("✅ Recreated compound unique index: playlist + spotifyId");
        } catch (recreateError) {
          console.error("❌ Error recreating index:", recreateError.message);
        }
      } else {
        console.error("❌ Error creating compound index:", error.message);
      }
    }

    // Check for potential duplicate issues before applying the new constraint
    console.log("🔍 Checking for duplicate spotifyId within playlists...");
    const duplicates = await collection.aggregate([
      {
        $match: {
          spotifyId: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: { playlist: "$playlist", spotifyId: "$spotifyId" },
          count: { $sum: 1 },
          songs: { $push: { _id: "$_id", title: "$title", artist: "$artist" } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate spotifyId(s) within playlists:`);
      duplicates.forEach((dup) => {
        console.log(`  Playlist: ${dup._id.playlist}, SpotifyId: ${dup._id.spotifyId}, Count: ${dup.count}`);
        dup.songs.forEach((song, index) => {
          console.log(`    ${index + 1}. ${song.title} by ${song.artist} (${song._id})`);
        });
      });
      
      console.log("🛠️  Removing duplicate songs (keeping the first one)...");
      for (const dup of duplicates) {
        // Keep the first song, remove the rest
        const songsToRemove = dup.songs.slice(1);
        for (const song of songsToRemove) {
          await collection.deleteOne({ _id: song._id });
          console.log(`   ✅ Removed duplicate: ${song.title} by ${song.artist}`);
        }
      }
    } else {
      console.log("✅ No duplicate spotifyIds found within playlists");
    }

    // List final indexes
    console.log("📋 Final indexes:");
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log("✅ Spotify ID index migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the migration if called directly
if (require.main === module) {
  fixSpotifyIndex()
    .then(() => {
      console.log("🎉 Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { fixSpotifyIndex };
