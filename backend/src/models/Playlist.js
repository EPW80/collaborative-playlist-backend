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
          enum: ["viewer", "contributor", "editor", "admin"],
          default: "contributor",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permissions: {
          canView: { type: Boolean, default: true },
          canSuggest: { type: Boolean, default: true },
          canEdit: { type: Boolean, default: false },
          canManageCollaborators: { type: Boolean, default: false },
          canDelete: { type: Boolean, default: false },
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
    // Pending song suggestions system for contributors
    pendingSuggestions: [
      {
        song: {
          title: { type: String, required: true },
          artist: { type: String, required: true },
          album: String,
          duration: Number,
          spotifyId: String,
          youtubeId: String,
          geniusId: String,
          previewUrl: String,
          imageUrl: String,
        },
        suggestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        suggestedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reviewedAt: Date,
        reviewNote: String,
      },
    ],
    // Real-time collaboration features
    nowPlaying: {
      songId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      action: {
        type: String,
        enum: ["play", "pause", "stop", "seek"],
        default: "stop",
      },
      position: {
        type: Number,
        default: 0,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    activeSession: {
      activeUsers: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          lastActivity: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["active", "idle", "away"],
            default: "active",
          },
        },
      ],
      lastActivity: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes for performance optimization
playlistSchema.index({ creator: 1, createdAt: -1 });
playlistSchema.index({ "collaborators.user": 1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ tags: 1 });
// Compound index for access control queries
playlistSchema.index({ creator: 1, "collaborators.user": 1, isPublic: 1 });
// Index for public playlist discovery
playlistSchema.index({ isPublic: 1, tags: 1, createdAt: -1 });

module.exports = mongoose.model("Playlist", playlistSchema);
