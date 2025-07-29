#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/createAdmin.js <username> <email> <password> [role]
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDB = require("../src/config/database");

async function createAdminUser() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 3) {
      console.log(
        "❌ Usage: node scripts/createAdmin.js <username> <email> <password> [role]"
      );
      console.log("   Role can be: admin (default) or superadmin");
      process.exit(1);
    }

    const [username, email, password, role = "admin"] = args;

    // Validate role
    if (!["admin", "superadmin"].includes(role)) {
      console.log("❌ Invalid role. Must be 'admin' or 'superadmin'");
      process.exit(1);
    }

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log("❌ User already exists with that email or username");
      process.exit(1);
    }

    // Create admin user
    const adminUser = new User({
      username,
      email,
      password,
      role,
    });

    await adminUser.save();

    console.log("🎉 Admin user created successfully!");
    console.log(`👤 Username: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Role: ${role}`);
    console.log(`🆔 ID: ${adminUser._id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
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

createAdminUser();
