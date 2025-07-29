#!/usr/bin/env node

/**
 * Script to check if a user exists and verify their credentials
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDB = require("../src/config/database");

async function checkUser() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.log("❌ Usage: node scripts/checkUser.js <email> [password]");
      process.exit(1);
    }

    const [email, password] = args;

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found with email: ${email}`);

      // Check for similar emails
      const similarUsers = await User.find({
        email: { $regex: email.split("@")[0], $options: "i" },
      }).select("email username role");

      if (similarUsers.length > 0) {
        console.log("🔍 Found similar users:");
        similarUsers.forEach((u) => {
          console.log(`   - ${u.username} (${u.email}) - Role: ${u.role}`);
        });
      }

      process.exit(1);
    }

    console.log("👤 User found:");
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Created: ${user.createdAt}`);

    // Test password if provided
    if (password) {
      const isMatch = await user.comparePassword(password);
      console.log(`🔐 Password check: ${isMatch ? "✅ Valid" : "❌ Invalid"}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Process interrupted");
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

checkUser();
