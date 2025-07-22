const mongoose = require("mongoose");
const User = require("../models/User");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

/**
 * @fileoverview Database index migration utility
 * @module utils/indexMigration
 * @description Ensures all performance indexes are created in the database
 */

/**
 * Create all database indexes for optimal performance
 * @returns {Promise<void>}
 */
const createIndexes = async () => {
  try {
    console.log("🔧 Starting database index creation...");

    // Create User indexes
    console.log("📊 Creating User model indexes...");
    await User.createIndexes();

    // Create Playlist indexes
    console.log("📊 Creating Playlist model indexes...");
    await Playlist.createIndexes();

    // Create Song indexes
    console.log("📊 Creating Song model indexes...");
    await Song.createIndexes();

    console.log("✅ All database indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating database indexes:", error);
    throw error;
  }
};

/**
 * Get index information for all collections
 * @returns {Promise<Object>} Index information for all models
 */
const getIndexInfo = async () => {
  try {
    const userIndexes = await User.collection.getIndexes();
    const playlistIndexes = await Playlist.collection.getIndexes();
    const songIndexes = await Song.collection.getIndexes();

    return {
      users: userIndexes,
      playlists: playlistIndexes,
      songs: songIndexes,
    };
  } catch (error) {
    console.error("❌ Error getting index information:", error);
    throw error;
  }
};

/**
 * Drop and recreate all indexes (use with caution)
 * @returns {Promise<void>}
 */
const recreateIndexes = async () => {
  try {
    console.log("⚠️  Dropping existing indexes...");

    await User.collection.dropIndexes();
    await Playlist.collection.dropIndexes();
    await Song.collection.dropIndexes();

    console.log("🔧 Recreating indexes...");
    await createIndexes();

    console.log("✅ All indexes recreated successfully");
  } catch (error) {
    console.error("❌ Error recreating indexes:", error);
    throw error;
  }
};

module.exports = {
  createIndexes,
  getIndexInfo,
  recreateIndexes,
};
