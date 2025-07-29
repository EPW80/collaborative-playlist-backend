const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupEmptySpotifyIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Song = require('./src/models/Song');
    
    // Find songs with empty string spotifyId
    const songsWithEmptySpotifyId = await Song.find({ spotifyId: '' });
    console.log(`📊 Found ${songsWithEmptySpotifyId.length} songs with empty spotifyId`);
    
    if (songsWithEmptySpotifyId.length > 0) {
      // Update them to remove the spotifyId field entirely
      const result = await Song.updateMany(
        { spotifyId: '' }, 
        { $unset: { spotifyId: 1 } }
      );
      console.log(`🔧 Updated ${result.modifiedCount} songs (removed empty spotifyId)`);
    }
    
    // Also check for empty youtubeId
    const songsWithEmptyYoutubeId = await Song.find({ youtubeId: '' });
    console.log(`📊 Found ${songsWithEmptyYoutubeId.length} songs with empty youtubeId`);
    
    if (songsWithEmptyYoutubeId.length > 0) {
      const result2 = await Song.updateMany(
        { youtubeId: '' }, 
        { $unset: { youtubeId: 1 } }
      );
      console.log(`🔧 Updated ${result2.modifiedCount} songs (removed empty youtubeId)`);
    }
    
    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupEmptySpotifyIds();
