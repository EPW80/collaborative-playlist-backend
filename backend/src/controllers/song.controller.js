const Playlist = require('../models/Playlist');

// Get all songs from a playlist
exports.getSongs = async (req, res) => {
  try {
    const { playlistId } = req.query;
    
    if (!playlistId) {
      return res.status(400).json({ message: 'Playlist ID is required' });
    }
    
    const playlist = await Playlist.findById(playlistId)
      .populate('songs.addedBy', 'username');
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check if user has access to this playlist
    const isCreator = playlist.creator.toString() === req.userId;
    const isCollaborator = playlist.collaborators.some(collab => 
      collab.toString() === req.userId
    );
    
    if (!playlist.isPublic && !isCreator && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(playlist.songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a song to a playlist
exports.addSong = async (req, res) => {
  try {
    const { playlistId, name, artist, album, duration } = req.body;
    
    if (!playlistId || !name || !artist) {
      return res.status(400).json({ 
        message: 'Playlist ID, song name, and artist are required' 
      });
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check if user has permission to add songs
    const isCreator = playlist.creator.toString() === req.userId;
    const isCollaborator = playlist.collaborators.some(collab => 
      collab.toString() === req.userId
    );
    
    if (!isCreator && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to add songs to this playlist' });
    }
    
    const newSong = {
      name,
      artist,
      album,
      duration,
      addedBy: req.userId,
      addedAt: Date.now()
    };
    
    playlist.songs.push(newSong);
    playlist.updatedAt = Date.now();
    
    await playlist.save();
    
    // Get the newly added song with populated user info
    const updatedPlaylist = await Playlist.findById(playlistId)
      .populate('songs.addedBy', 'username');
    
    const addedSong = updatedPlaylist.songs[updatedPlaylist.songs.length - 1];
    
    // Notify clients about the new song
    const io = req.app.get('io');
    io.to(`playlist-${playlistId}`).emit('song-added', {
      playlistId,
      song: addedSong
    });
    
    res.status(201).json(addedSong);
  } catch (error) {
    console.error('Error adding song:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a song from a playlist
exports.removeSong = async (req, res) => {
  try {
    const { playlistId } = req.query;
    const songId = req.params.id;
    
    if (!playlistId) {
      return res.status(400).json({ message: 'Playlist ID is required' });
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check if user has permission to remove songs
    const isCreator = playlist.creator.toString() === req.userId;
    const isCollaborator = playlist.collaborators.some(collab => 
      collab.toString() === req.userId
    );
    
    if (!isCreator && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to remove songs from this playlist' });
    }
    
    // Check if song exists
    const songIndex = playlist.songs.findIndex(song => song._id.toString() === songId);
    
    if (songIndex === -1) {
      return res.status(404).json({ message: 'Song not found in playlist' });
    }
    
    // Remove the song
    playlist.songs.splice(songIndex, 1);
    playlist.updatedAt = Date.now();
    
    await playlist.save();
    
    // Notify clients about the removed song
    const io = req.app.get('io');
    io.to(`playlist-${playlistId}`).emit('song-removed', {
      playlistId,
      songId
    });
    
    res.json({ message: 'Song removed successfully' });
  } catch (error) {
    console.error('Error removing song:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search for songs in a playlist
exports.searchSongs = async (req, res) => {
  try {
    const { playlistId, q } = req.query;
    
    if (!playlistId || !q) {
      return res.status(400).json({ 
        message: 'Playlist ID and search query are required' 
      });
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check if user has access to this playlist
    const isCreator = playlist.creator.toString() === req.userId;
    const isCollaborator = playlist.collaborators.some(collab => 
      collab.toString() === req.userId
    );
    
    if (!playlist.isPublic && !isCreator && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Search for songs matching the query
    const searchQuery = q.toLowerCase();
    const matchingSongs = playlist.songs.filter(song => 
      song.name.toLowerCase().includes(searchQuery) || 
      song.artist.toLowerCase().includes(searchQuery) ||
      (song.album && song.album.toLowerCase().includes(searchQuery))
    );
    
    res.json(matchingSongs);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
