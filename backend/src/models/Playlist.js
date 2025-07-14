const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "editor", "viewer"],
          default: "editor",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    settings: {
      allowDuplicates: {
        type: Boolean,
        default: false,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      maxSongs: {
        type: Number,
        default: 1000,
      },
    },
    tags: [String],
    coverImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes for performance optimization
playlistSchema.index({ creator: 1, createdAt: -1 });
playlistSchema.index({ 'collaborators.user': 1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ tags: 1 });
// Compound index for access control queries
playlistSchema.index({ creator: 1, 'collaborators.user': 1, isPublic: 1 });
// Index for public playlist discovery
playlistSchema.index({ isPublic: 1, tags: 1, createdAt: -1 });

module.exports = mongoose.model("Playlist", playlistSchema);
