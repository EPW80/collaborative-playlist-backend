const aiService = require('../services/aiService');
const Playlist = require('../models/Playlist');
const { validationResult } = require('express-validator');

/**
 * Generate creative playlist names based on songs
 */
const generatePlaylistNames = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { songs } = req.body;

    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Songs array is required and must not be empty'
      });
    }

    const suggestions = await aiService.generatePlaylistName(songs);

    res.json({
      success: true,
      data: {
        suggestions,
        aiEnabled: aiService.isAIEnabled()
      }
    });
  } catch (error) {
    console.error('Error generating playlist names:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      return res.status(200).json({
        success: true,
        data: {
          suggestions: [
            'My Awesome Playlist',
            'Music Mix',
            'Favorite Tunes',
            'Daily Vibes',
            'Sound Collection'
          ],
          aiEnabled: false,
          message: 'AI quota exceeded. Using fallback suggestions.'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate playlist names'
    });
  }
};

/**
 * Get AI-powered song recommendations for a playlist
 */
const getSongRecommendations = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const userPreferences = req.body.preferences || {};

    // Find the playlist
    const playlist = await Playlist.findById(playlistId)
      .populate('songs')
      .populate('creator', 'username email');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user has access to the playlist
    const userId = req.user.id;
    const hasAccess = playlist.creator._id.toString() === userId || 
                     playlist.collaborators.some(collab => 
                       collab.user.toString() === userId
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this playlist'
      });
    }

    const recommendations = await aiService.suggestNextSong(playlist, userPreferences);

    res.json({
      success: true,
      data: {
        ...recommendations,
        playlistId: playlist._id,
        playlistName: playlist.name,
        aiEnabled: aiService.isAIEnabled()
      }
    });
  } catch (error) {
    console.error('Error getting song recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get song recommendations'
    });
  }
};

/**
 * Generate playlist description based on songs
 */
const generatePlaylistDescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;

    // Find the playlist
    const playlist = await Playlist.findById(playlistId)
      .populate('songs')
      .populate('creator', 'username email');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user has edit access
    const userId = req.user.id;
    const hasEditAccess = playlist.creator._id.toString() === userId || 
                         playlist.collaborators.some(collab => 
                           collab.user.toString() === userId && 
                           ['editor', 'admin'].includes(collab.role)
                         );

    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to modify playlist'
      });
    }

    const description = await aiService.generatePlaylistDescription(
      playlist.songs,
      { name: playlist.name }
    );

    // Optionally update the playlist with the generated description
    if (req.body.updatePlaylist) {
      playlist.description = description;
      await playlist.save();
    }

    res.json({
      success: true,
      data: {
        description,
        updated: !!req.body.updatePlaylist,
        aiEnabled: aiService.isAIEnabled()
      }
    });
  } catch (error) {
    console.error('Error generating playlist description:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate playlist description'
    });
  }
};

/**
 * Analyze playlist and provide insights
 */
const analyzePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;

    // Find the playlist
    const playlist = await Playlist.findById(playlistId)
      .populate('songs')
      .populate('creator', 'username email')
      .populate('collaborators.user', 'username email');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user has access to the playlist
    const userId = req.user.id;
    const hasAccess = playlist.creator._id.toString() === userId || 
                     playlist.collaborators.some(collab => 
                       collab.user._id.toString() === userId
                     );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this playlist'
      });
    }

    const analysis = await aiService.analyzePlaylist(playlist);

    res.json({
      success: true,
      data: {
        ...analysis,
        playlistInfo: {
          id: playlist._id,
          name: playlist.name,
          songCount: playlist.songs.length,
          owner: playlist.creator.username,
          created: playlist.createdAt
        },
        aiEnabled: aiService.isAIEnabled()
      }
    });
  } catch (error) {
    console.error('Error analyzing playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze playlist'
    });
  }
};

/**
 * Get AI service status and capabilities
 */
const getAIStatus = async (req, res) => {
  try {
    const status = aiService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status'
    });
  }
};

/**
 * Smart playlist creation with AI assistance
 */
const createSmartPlaylist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { seeds, preferences = {}, autoName = true, autoDescription = true } = req.body;
    const userId = req.user.id;

    // Seeds can be song IDs, artist names, or genre preferences
    if (!seeds || seeds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Seeds are required for smart playlist creation'
      });
    }

    // This would integrate with music services to find songs based on seeds
    // For now, we'll create a basic playlist structure
    let playlistName = 'Smart Playlist';
    let description = 'AI-generated playlist based on your preferences';

    // Generate AI name if requested
    if (autoName && seeds.length > 0) {
      try {
        const nameOptions = await aiService.generatePlaylistName(seeds);
        playlistName = nameOptions[0] || playlistName;
      } catch (error) {
        console.warn('Failed to generate AI playlist name:', error);
      }
    }

    // Create the playlist
    const playlist = new Playlist({
      name: playlistName,
      description: autoDescription ? description : req.body.description || '',
      creator: userId,
      songs: [], // Would be populated with recommended songs
      tags: preferences.genres || [],
      isPublic: req.body.isPublic || false,
      aiGenerated: true,
      aiSeedData: {
        seeds,
        preferences,
        createdAt: new Date()
      }
    });

    await playlist.save();

    res.status(201).json({
      success: true,
      data: {
        playlist,
        aiEnabled: aiService.isAIEnabled(),
        message: 'Smart playlist created. Add songs or use AI recommendations to populate it.'
      }
    });
  } catch (error) {
    console.error('Error creating smart playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create smart playlist'
    });
  }
};

module.exports = {
  generatePlaylistNames,
  getSongRecommendations,
  generatePlaylistDescription,
  analyzePlaylist,
  getAIStatus,
  createSmartPlaylist
};
