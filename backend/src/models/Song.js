const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    album: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    spotifyId: {
      type: String,
      unique: true,
      sparse: true,
    },
    youtubeId: {
      type: String,
      sparse: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    playlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    votes: {
      upvotes: {
        type: Number,
        default: 0,
      },
      downvotes: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
      lastVoteUpdate: {
        type: Date,
        default: Date.now,
      },
    },
    userVotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        type: {
          type: String,
          enum: ["upvote", "downvote"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    geniusData: {
      geniusId: Number,
      lyricsUrl: String,
      thumbnail: String,
      fullImage: String,
      releaseDate: String,
      stats: {
        hotness: Boolean,
        pageViews: Number,
      },
    },
    metadata: {
      genre: String,
      year: Number,
      explicit: Boolean,
      popularity: Number,
      externalUrl: String,
      previewUrl: String,
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes for performance optimization
songSchema.index({ playlist: 1, order: 1 });
songSchema.index({ playlist: 1, addedAt: -1 });
songSchema.index({ title: "text", artist: "text", album: "text" }); // Text search
// Note: spotifyId already has unique index from schema definition
songSchema.index({ youtubeId: 1 }, { sparse: true });
songSchema.index({ addedBy: 1, addedAt: -1 });
// Compound index for playlist queries with ordering
songSchema.index({ playlist: 1, order: 1, addedAt: -1 });

module.exports = mongoose.model("Song", songSchema);
