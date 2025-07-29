const mongoose = require("mongoose");

/**
 * Force drop the problematic spotifyId index from MongoDB Atlas
 */
async function forceDropSpotifyIndex() {
  try {
    console.log(
      "🔧 Force dropping spotifyId index from production database..."
    );

    // Connect to MongoDB (use the production URI from environment)
    const uri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/collaborative-playlist";
    await mongoose.connect(uri);
    console.log("🔗 Connected to MongoDB:", uri.split("@")[1] || "localhost");

    // Get the Song collection
    const collection = mongoose.connection.db.collection("songs");

    // List all indexes
    console.log("📋 All current indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(
        `  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)} ${
          index.unique ? "(UNIQUE)" : ""
        } ${index.sparse ? "(SPARSE)" : ""}`
      );
    });

    // Try to drop any spotifyId-related indexes
    const spotifyIndexes = indexes.filter(
      (idx) =>
        idx.name.includes("spotifyId") &&
        !idx.name.includes("playlist") && // Don't drop our compound index
        Object.keys(idx.key).includes("spotifyId")
    );

    if (spotifyIndexes.length === 0) {
      console.log("✅ No problematic spotifyId indexes found");
    } else {
      console.log(
        `🎯 Found ${spotifyIndexes.length} spotifyId index(es) to remove:`
      );

      for (const index of spotifyIndexes) {
        try {
          console.log(
            `   Dropping: ${index.name} ${JSON.stringify(index.key)}`
          );
          await collection.dropIndex(index.name);
          console.log(`   ✅ Successfully dropped: ${index.name}`);
        } catch (error) {
          console.error(`   ❌ Failed to drop ${index.name}:`, error.message);
        }
      }
    }

    // Verify final state
    console.log("\n📋 Final indexes:");
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(
        `  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)} ${
          index.unique ? "(UNIQUE)" : ""
        } ${index.sparse ? "(SPARSE)" : ""}`
      );
    });

    console.log("✅ Index cleanup completed!");
  } catch (error) {
    console.error("❌ Failed to clean up indexes:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the cleanup if called directly
if (require.main === module) {
  forceDropSpotifyIndex()
    .then(() => {
      console.log("🎉 Index cleanup completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Index cleanup failed:", error);
      process.exit(1);
    });
}

module.exports = { forceDropSpotifyIndex };
