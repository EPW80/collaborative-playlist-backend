const Playlist = require("../models/Playlist");
const User = require("../models/User");

// Get all playlists
exports.getPlaylists = async (req, res) => {
  try {
    // Get user's playlists and public playlists
    const playlists = await Playlist.find({
      $or: [
        { creator: req.userId },
        { collaborators: req.userId },
        { isPublic: true },
      ],
    })
      .populate("creator", "username")
      .populate("collaborators", "username");

    res.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new playlist
exports.createPlaylist = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const newPlaylist = new Playlist({
      name,
      description,
      creator: req.userId,
      isPublic: isPublic || false,
      songs: [],
    });

    const playlist = await newPlaylist.save();

    // Add playlist to user's playlists
    await User.findByIdAndUpdate(req.userId, {
      $push: { playlists: playlist._id },
    });

    // Notify clients about the new playlist
    const io = req.app.get("io");
    io.emit("playlist-created", playlist);

    res.status(201).json(playlist);
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single playlist by ID
exports.getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("creator", "username")
      .populate("collaborators", "username")
      .populate("songs.addedBy", "username");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Check if user has access to this playlist
    const isCreator = playlist.creator._id.toString() === req.userId;
    const isCollaborator = playlist.collaborators.some(
      (collab) => collab._id.toString() === req.userId
    );

    if (!playlist.isPublic && !isCreator && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(playlist);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a playlist
exports.updatePlaylist = async (req, res) => {
  try {
    const { name, description, isPublic, collaborators } = req.body;

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Verify ownership
    if (playlist.creator.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this playlist" });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      req.params.id,
      {
        name: name || playlist.name,
        description:
          description !== undefined ? description : playlist.description,
        isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
        collaborators: collaborators || playlist.collaborators,
        updatedAt: Date.now(),
      },
      { new: true }
    )
      .populate("creator", "username")
      .populate("collaborators", "username");

    // Notify clients about the playlist update
    const io = req.app.get("io");
    io.to(`playlist-${req.params.id}`).emit(
      "playlist-updated",
      updatedPlaylist
    );

    res.json(updatedPlaylist);
  } catch (error) {
    console.error("Error updating playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a playlist
exports.deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Verify ownership
    if (playlist.creator.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this playlist" });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    // Remove playlist from user's playlists
    await User.updateMany(
      { playlists: req.params.id },
      { $pull: { playlists: req.params.id } }
    );

    // Notify clients about the deletion
    const io = req.app.get("io");
    io.to(`playlist-${req.params.id}`).emit("playlist-deleted", req.params.id);

    res.json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};
