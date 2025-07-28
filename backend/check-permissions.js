require("dotenv").config();
const mongoose = require("mongoose");

async function checkPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const User = require("./src/models/User");
    const Playlist = require("./src/models/Playlist");
    const rbacService = require("./src/services/rbacService");

    // Find debug admin user
    const user = await User.findOne({ email: "debug_admin@example.com" });
    if (!user) {
      console.log("❌ Debug admin user not found");
      return;
    }
    console.log("👤 Found user:", user.username, "- Role:", user.role);

    // Find test playlist
    const playlist = await Playlist.findById("687f2917cfab201323084ab4")
      .populate("creator", "username")
      .populate("collaborators.user", "username");

    if (!playlist) {
      console.log("❌ Test playlist not found");
      return;
    }

    console.log("\n📋 Playlist info:");
    console.log("- Name:", playlist.name);
    console.log("- Creator:", playlist.creator.username);
    console.log("- Is Public:", playlist.isPublic);
    console.log("- Collaborators:", playlist.collaborators.length);

    // Check user's role in playlist
    const userRole = rbacService.getUserRole(user._id.toString(), playlist);
    console.log("\n🔑 User's role in playlist:", userRole || "No access");

    if (userRole) {
      const permissions = rbacService.rolePermissions[userRole];
      console.log("\n🛡️ Permissions for", userRole, "role:");
      Object.entries(permissions).forEach(([permission, allowed]) => {
        const status = allowed ? "✅" : "❌";
        console.log(`  ${status} ${permission}: ${allowed}`);
      });

      // Test specific permissions
      console.log("\n🎵 Song management permissions:");
      console.log("- Can add songs:", rbacService.hasPermission(user._id.toString(), playlist, "canAddSongs"));
      console.log("- Can remove songs:", rbacService.hasPermission(user._id.toString(), playlist, "canRemoveSongs"));
    }

    // If user doesn't have access, let's add them as contributor
    if (!userRole || userRole === "viewer") {
      console.log("\n⚠️ User needs contributor access to add songs");
      console.log("🔧 Adding user as contributor...");
      
      // Remove existing collaborator entry if exists
      playlist.collaborators = playlist.collaborators.filter(
        collab => collab.user._id.toString() !== user._id.toString()
      );
      
      // Add as contributor
      playlist.collaborators.push({
        user: user._id,
        role: "contributor",
        addedAt: Date.now()
      });
      
      await playlist.save();
      console.log("✅ User added as contributor");

      // Re-check permissions
      const newRole = rbacService.getUserRole(user._id.toString(), playlist);
      console.log("🔄 New role:", newRole);
      console.log("- Can add songs:", rbacService.hasPermission(user._id.toString(), playlist, "canAddSongs"));
      console.log("- Can remove songs:", rbacService.hasPermission(user._id.toString(), playlist, "canRemoveSongs"));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkPermissions();
