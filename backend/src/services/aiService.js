const OpenAI = require("openai");

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.isEnabled = !!process.env.OPENAI_API_KEY;
  }

  /**
   * Generate creative playlist names based on song content
   * @param {Array} songs - Array of song objects with title, artist, genre info
   * @returns {Promise<Array>} Array of suggested playlist names
   */
  async generatePlaylistName(songs) {
    if (!this.isEnabled) {
      return this.getFallbackPlaylistNames(songs);
    }

    try {
      const songList = songs
        .slice(0, 10)
        .map(
          (song) =>
            `"${song.title}" by ${song.artist}${
              song.album ? ` (${song.album})` : ""
            }`
        )
        .join("\n");

      const prompt = `Based on the following songs, suggest 5 creative and catchy playlist names that capture the mood, genre, or theme of the music:

${songList}

Consider:
- Musical genres and styles
- Common themes or moods
- Time periods or eras
- Emotional tone
- Activity contexts (workout, study, party, etc.)

Return only the playlist names, one per line, without numbers or bullets.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a music curator expert at creating memorable and creative playlist names. Keep names under 50 characters and make them engaging.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      const suggestions = response.choices[0].message.content
        .trim()
        .split("\n")
        .filter((name) => name.trim())
        .map((name) => name.trim().replace(/^[-•*]\s*/, ""))
        .slice(0, 5);

      return suggestions.length > 0
        ? suggestions
        : this.getFallbackPlaylistNames(songs);
    } catch (error) {
      console.error("AI playlist name generation failed:", error);
      return this.getFallbackPlaylistNames(songs);
    }
  }

  /**
   * Suggest next songs based on playlist content and user preferences
   * @param {Object} playlist - Playlist object with songs array
   * @param {Object} userPreferences - User music preferences
   * @returns {Promise<Object>} Recommendations with reasoning
   */
  async suggestNextSong(playlist, userPreferences = {}) {
    if (!this.isEnabled) {
      return this.getFallbackSongSuggestions(playlist);
    }

    try {
      const recentSongs = playlist.songs.slice(-5);
      const songAnalysis = recentSongs.map((song) => ({
        title: song.title,
        artist: song.artist,
        genre: song.metadata?.genre || "Unknown",
        energy: song.metadata?.energy || "Medium",
        mood: song.metadata?.mood || "Neutral",
      }));

      const prompt = `Analyze this playlist and suggest 3 songs that would fit well:

Current playlist: "${playlist.name}"
Recent songs:
${songAnalysis
  .map((s) => `- "${s.title}" by ${s.artist} (Genre: ${s.genre})`)
  .join("\n")}

User preferences: ${JSON.stringify(userPreferences)}

Suggest 3 songs that would complement this playlist. For each suggestion, provide:
1. Song title and artist
2. Brief reason why it fits
3. How it adds to the playlist flow

Format as JSON array with objects containing: title, artist, reason, genre`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a music recommendation expert. Provide thoughtful song suggestions that consider musical flow, genre compatibility, and user preferences.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      try {
        let content = response.choices[0].message.content;

        // Clean up markdown formatting if present
        content = content
          .replace(/```json\s*/g, "")
          .replace(/```\s*$/g, "")
          .trim();

        const suggestions = JSON.parse(content);
        return {
          suggestions: Array.isArray(suggestions)
            ? suggestions.slice(0, 3)
            : [],
          reasoning: "AI-powered recommendations based on playlist analysis",
        };
      } catch (parseError) {
        console.error("Failed to parse AI song suggestions:", parseError);
        return this.getFallbackSongSuggestions(playlist);
      }
    } catch (error) {
      console.error("AI song suggestion failed:", error);
      return this.getFallbackSongSuggestions(playlist);
    }
  }

  /**
   * Generate descriptive playlist descriptions
   * @param {Array} songs - Array of song objects
   * @param {Object} playlistInfo - Basic playlist information (name, metadata)
   * @returns {Promise<String>} Generated description
   */
  async generatePlaylistDescription(songs, playlistInfo = {}) {
    if (!this.isEnabled) {
      return this.getFallbackDescription(songs, playlistInfo);
    }

    try {
      // Use more songs for better context (up to 15 as in your enhancement)
      const songDetails = songs
        .slice(0, 15)
        .map((song) => `${song.title} by ${song.artist}`)
        .join(", ");

      const prompt = `Generate a compelling 2-3 sentence description for a playlist containing: ${songDetails}. 
The playlist is named "${
        playlistInfo.name || "this playlist"
      }". Make it engaging and highlight the mood/vibe.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a music journalist who writes compelling playlist descriptions. Make them vivid, concise, and appealing to music lovers.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100, // Reduced for more concise output as in your enhancement
        temperature: 0.7,
      });

      const description = response.choices[0].message.content.trim();
      return description || this.getFallbackDescription(songs, playlistInfo);
    } catch (error) {
      console.error("AI description generation failed:", error);
      return this.getFallbackDescription(songs, playlistInfo);
    }
  }

  /**
   * Analyze playlist for insights and recommendations
   * @param {Object} playlist - Full playlist object
   * @returns {Promise<Object>} Playlist insights
   */
  async analyzePlaylist(playlist) {
    if (!this.isEnabled) {
      return this.getFallbackAnalysis(playlist);
    }

    try {
      const songs = playlist.songs;
      const artists = [...new Set(songs.map((s) => s.artist))];
      const genres = [
        ...new Set(songs.map((s) => s.metadata?.genre).filter(Boolean)),
      ];

      const prompt = `Analyze this playlist and provide insights:

Playlist: "${playlist.name}"
Songs: ${songs.length}
Artists: ${artists.slice(0, 10).join(", ")}
Genres: ${genres.slice(0, 5).join(", ")}

Provide a JSON response with:
{
  "overallMood": "description of the playlist mood",
  "dominantGenres": ["top 3 genres"],
  "recommendedListeningContexts": ["when/where to listen"],
  "musicalEra": "time period or era",
  "energyLevel": "low/medium/high",
  "coherenceScore": 85,
  "highlights": ["notable aspects of the playlist"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a music analyst providing objective insights about playlists. Return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.5,
      });

      let content = response.choices[0].message.content;

      // Clean up markdown formatting if present
      content = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/g, "")
        .trim();

      return JSON.parse(content);
    } catch (error) {
      console.error("AI playlist analysis failed:", error);
      return this.getFallbackAnalysis(playlist);
    }
  }

  // Fallback methods for when AI is not available
  getFallbackPlaylistNames(songs) {
    const templates = [
      "My Awesome Mix",
      "Playlist " + new Date().getFullYear(),
      "Musical Journey",
      "Sound Collection",
      "Favorites Mix",
    ];

    // Try to be smart about naming based on first few artists
    if (songs.length > 0) {
      const firstArtist = songs[0].artist;
      templates.unshift(`${firstArtist} & More`);
      templates.unshift(`Inspired by ${firstArtist}`);
    }

    return templates.slice(0, 5);
  }

  getFallbackSongSuggestions(playlist) {
    return {
      suggestions: [
        {
          title: "Explore similar artists",
          artist: "Various",
          reason: "Based on your current playlist style",
          genre: "Mixed",
        },
      ],
      reasoning: "Basic recommendations (AI features require OpenAI API key)",
    };
  }

  getFallbackDescription(songs, playlistInfo) {
    const songCount = songs.length;
    const name = playlistInfo.name || "this playlist";

    if (songCount === 0) {
      return `${name} is ready for your favorite tracks.`;
    } else if (songCount === 1) {
      return `${name} features "${songs[0].title}" by ${songs[0].artist}.`;
    } else {
      return `${name} contains ${songCount} carefully selected tracks perfect for any occasion.`;
    }
  }

  getFallbackAnalysis(playlist) {
    const songs = playlist.songs;
    const artists = [...new Set(songs.map((s) => s.artist))];

    return {
      overallMood: "Mixed vibes",
      dominantGenres: ["Various"],
      recommendedListeningContexts: ["Anytime listening"],
      musicalEra: "Contemporary",
      energyLevel: "medium",
      coherenceScore: 75,
      highlights: [
        `Features ${artists.length} different artists`,
        `${songs.length} total tracks`,
        "Curated by music lovers",
      ],
    };
  }

  /**
   * Check if AI features are available
   * @returns {Boolean}
   */
  isAIEnabled() {
    return this.isEnabled;
  }

  /**
   * Get AI service status and configuration
   * @returns {Object}
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      model: "gpt-3.5-turbo",
      features: [
        "Playlist name generation",
        "Song recommendations",
        "Description generation",
        "Playlist analysis",
      ],
    };
  }
}

module.exports = new AIService();
