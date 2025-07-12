const mongoose = require("mongoose");
const config = require("./index");

/**
 * @fileoverview Database connection configuration
 * @module config/database
 * @requires mongoose
 * @requires ./index
 */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
    });

    // Graceful exit
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed through app termination");
      process.exit(0);
    });

  } catch (error) {
    console.error("💥 Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
