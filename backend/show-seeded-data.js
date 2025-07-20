const mongoose = require("mongoose");
const config = require("./src/config/index");

async function showSeededData() {
  try {
    console.log(
      "🔍 COLLABORATIVE PLAYLIST MANAGER - SEEDED DATA DEMONSTRATION"
    );
    console.log("=".repeat(70));

    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log(
      "✅ Connected to MongoDB:",
      config.mongoUri.replace(/\/\/.*@/, "//***:***@")
    );

    // Load models
    const User = require("./src/models/User");
    const Playlist = require("./src/models/Playlist");
    const Song = require("./src/models/Song");

    console.log("\n📊 DATABASE STATISTICS");
    console.log("-".repeat(30));
    const userCount = await User.countDocuments();
    const playlistCount = await Playlist.countDocuments();
    const songCount = await Song.countDocuments();

    console.log(`👥 Total Users: ${userCount}`);
    console.log(`🎵 Total Playlists: ${playlistCount}`);
    console.log(`🎶 Total Songs: ${songCount}`);

    // Show Users Collection
    console.log("\n👥 USERS COLLECTION");
    console.log("-".repeat(50));
    const users = await User.find()
      .select("username email createdAt spotifyId preferences")
      .sort({ createdAt: -1 })
      .limit(5);

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. USER DOCUMENT:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log(`   Theme: ${user.preferences?.theme || "light"}`);
      console.log(`   Spotify ID: ${user.spotifyId || "Not connected"}`);
    });

    // Show Playlists Collection with populated data
    console.log("\n\n🎵 PLAYLISTS COLLECTION");
    console.log("-".repeat(50));
    const playlists = await Playlist.find()
      .populate("creator", "username email")
      .populate("collaborators.user", "username")
      .populate("songs")
      .sort({ createdAt: -1 });

    playlists.forEach((playlist, index) => {
      console.log(`\n${index + 1}. PLAYLIST DOCUMENT:`);
      console.log(`   ID: ${playlist._id}`);
      console.log(`   Name: "${playlist.name}"`);
      console.log(
        `   Description: "${playlist.description || "No description"}"`
      );
      console.log(
        `   Creator: ${playlist.creator?.username} (${playlist.creator?.email})`
      );
      console.log(`   Public: ${playlist.isPublic}`);
      console.log(`   Songs Count: ${playlist.songs?.length || 0}`);
      console.log(`   Collaborators: ${playlist.collaborators?.length || 0}`);
      console.log(`   Settings:`);
      console.log(
        `     - Allow Duplicates: ${playlist.settings?.allowDuplicates}`
      );
      console.log(
        `     - Require Approval: ${playlist.settings?.requireApproval}`
      );
      console.log(`     - Max Songs: ${playlist.settings?.maxSongs}`);
      console.log(`   Created: ${playlist.createdAt.toISOString()}`);
      console.log(`   Updated: ${playlist.updatedAt.toISOString()}`);

      if (playlist.collaborators?.length > 0) {
        console.log(`   Collaborators Details:`);
        playlist.collaborators.forEach((collab, i) => {
          console.log(
            `     ${i + 1}. ${collab.user?.username} (${
              collab.role
            }) - Joined: ${collab.joinedAt.toISOString()}`
          );
        });
      }
    });

    // Show Songs Collection with populated data
    console.log("\n\n🎶 SONGS COLLECTION");
    console.log("-".repeat(50));
    const songs = await Song.find()
      .populate("addedBy", "username")
      .populate("playlist", "name")
      .populate("votes.user", "username")
      .sort({ addedAt: -1 });

    songs.forEach((song, index) => {
      console.log(`\n${index + 1}. SONG DOCUMENT:`);
      console.log(`   ID: ${song._id}`);
      console.log(`   Title: "${song.title}"`);
      console.log(`   Artist: ${song.artist}`);
      console.log(`   Album: ${song.album || "Unknown Album"}`);
      console.log(
        `   Duration: ${song.duration}s (${Math.floor(song.duration / 60)}:${(
          song.duration % 60
        )
          .toString()
          .padStart(2, "0")})`
      );
      console.log(`   Added By: ${song.addedBy?.username}`);
      console.log(`   Playlist: "${song.playlist?.name}"`);
      console.log(`   Order: ${song.order}`);
      console.log(`   Spotify ID: ${song.spotifyId || "Not linked"}`);
      console.log(`   Added At: ${song.addedAt.toISOString()}`);

      if (song.votes?.length > 0) {
        const upvotes = song.votes.filter((v) => v.type === "up").length;
        const downvotes = song.votes.filter((v) => v.type === "down").length;
        console.log(`   Votes: ↑${upvotes} ↓${downvotes}`);
      }

      if (song.metadata?.genre) {
        console.log(`   Metadata:`);
        console.log(`     - Genre: ${song.metadata.genre}`);
        console.log(`     - Year: ${song.metadata.year || "Unknown"}`);
        console.log(`     - Explicit: ${song.metadata.explicit || false}`);
      }
    });

    // Show relationship queries
    console.log("\n\n🔗 RELATIONSHIP QUERIES");
    console.log("-".repeat(50));

    // User's playlists
    const firstUser = users[0];
    if (firstUser) {
      const userPlaylists = await Playlist.find({
        creator: firstUser._id,
      }).populate("songs");
      console.log(
        `\n📝 ${firstUser.username}'s Playlists (${userPlaylists.length}):`
      );
      userPlaylists.forEach((playlist, i) => {
        console.log(
          `   ${i + 1}. "${playlist.name}" - ${
            playlist.songs?.length || 0
          } songs`
        );
      });
    }

    // Songs by user
    if (firstUser) {
      const userSongs = await Song.find({ addedBy: firstUser._id }).populate(
        "playlist",
        "name"
      );
      console.log(
        `\n🎵 Songs added by ${firstUser.username} (${userSongs.length}):`
      );
      userSongs.forEach((song, i) => {
        console.log(
          `   ${i + 1}. "${song.title}" by ${song.artist} → "${
            song.playlist?.name
          }"`
        );
      });
    }

    // Public playlists
    const publicPlaylists = await Playlist.find({ isPublic: true })
      .populate("creator", "username")
      .populate("songs");
    console.log(`\n🌍 Public Playlists (${publicPlaylists.length}):`);
    publicPlaylists.forEach((playlist, i) => {
      console.log(
        `   ${i + 1}. "${playlist.name}" by ${playlist.creator?.username} - ${
          playlist.songs?.length || 0
        } songs`
      );
    });

    console.log("\n" + "=".repeat(70));
    console.log("✅ SEEDED DATA DEMONSTRATION COMPLETE");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

showSeededData();
