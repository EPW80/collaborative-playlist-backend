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
    votes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        type: {
          type: String,
          enum: ["up", "down"],
        },
      },
    ],
    metadata: {
      genre: String,
      year: Number,
      explicit: Boolean,
      popularity: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes for performance optimization
songSchema.index({ playlist: 1, order: 1 });
songSchema.index({ playlist: 1, addedAt: -1 });
songSchema.index({ title: 'text', artist: 'text', album: 'text' }); // Text search
// Note: spotifyId already has unique index from schema definition
songSchema.index({ youtubeId: 1 }, { sparse: true });
songSchema.index({ addedBy: 1, addedAt: -1 });
// Compound index for playlist queries with ordering
songSchema.index({ playlist: 1, order: 1, addedAt: -1 });

module.exports = mongoose.model("Song", songSchema);
