import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const aiAPI = axios.create({
  baseURL: `${API_URL}/ai`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
aiAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class AIService {
  /**
   * Get AI service status and capabilities
   */
  async getStatus() {
    try {
      const response = await aiAPI.get("/status");
      return response.data;
    } catch (error) {
      console.error("Error getting AI status:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate creative playlist names based on songs
   * @param {Array} songs - Array of song objects
   * @returns {Promise<Array>} Array of suggested names
   */
  async generatePlaylistNames(songs) {
    try {
      const response = await aiAPI.post("/generate-names", { songs });
      return response.data;
    } catch (error) {
      console.error("Error generating playlist names:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get AI-powered song recommendations for a playlist
   * @param {string} playlistId - Playlist ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Recommendations with reasoning
   */
  async getSongRecommendations(playlistId, preferences = {}) {
    try {
      const response = await aiAPI.post(`/recommendations/${playlistId}`, {
        preferences,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting song recommendations:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate playlist description using AI
   * @param {string} playlistId - Playlist ID
   * @param {boolean} updatePlaylist - Whether to update the playlist with generated description
   * @returns {Promise<Object>} Generated description
   */
  async generatePlaylistDescription(playlistId, updatePlaylist = false) {
    try {
      const response = await aiAPI.post(`/generate-description/${playlistId}`, {
        updatePlaylist,
      });
      return response.data;
    } catch (error) {
      console.error("Error generating playlist description:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyze playlist and get AI insights
   * @param {string} playlistId - Playlist ID
   * @returns {Promise<Object>} Playlist analysis and insights
   */
  async analyzePlaylist(playlistId) {
    try {
      const response = await aiAPI.get(`/analyze/${playlistId}`);
      return response.data;
    } catch (error) {
      console.error("Error analyzing playlist:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a smart playlist with AI assistance
   * @param {Object} config - Smart playlist configuration
   * @returns {Promise<Object>} Created playlist
   */
  async createSmartPlaylist(config) {
    try {
      const response = await aiAPI.post("/smart-playlist", config);
      return response.data;
    } catch (error) {
      console.error("Error creating smart playlist:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if AI features are available
   * @returns {Promise<boolean>}
   */
  async isAIAvailable() {
    try {
      const status = await this.getStatus();
      return status.data?.enabled || false;
    } catch (error) {
      console.warn("Could not check AI availability:", error);
      return false;
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - API error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || "AI service error";
      const status = error.response.status;

      if (status === 401) {
        // Handle authentication errors
        localStorage.removeItem("token");
        window.location.href = "/login";
        return new Error("Authentication required");
      }

      if (status === 403) {
        return new Error("Access denied to AI features");
      }

      if (status === 404) {
        return new Error("Resource not found");
      }

      if (status >= 500) {
        return new Error("AI service temporarily unavailable");
      }

      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error("Network error - please check your connection");
    } else {
      // Other error
      return new Error(error.message || "Unexpected error occurred");
    }
  }

  /**
   * Batch process multiple AI operations
   * @param {Array} operations - Array of AI operations
   * @returns {Promise<Array>} Results from all operations
   */
  async batchProcess(operations) {
    try {
      const promises = operations.map((op) => {
        switch (op.type) {
          case "generateNames":
            return this.generatePlaylistNames(op.songs);
          case "recommend":
            return this.getSongRecommendations(op.playlistId, op.preferences);
          case "analyze":
            return this.analyzePlaylist(op.playlistId);
          case "generateDescription":
            return this.generatePlaylistDescription(
              op.playlistId,
              op.updatePlaylist
            );
          default:
            return Promise.reject(
              new Error(`Unknown operation type: ${op.type}`)
            );
        }
      });

      const results = await Promise.allSettled(promises);
      return results.map((result, index) => ({
        operation: operations[index],
        success: result.status === "fulfilled",
        data: result.status === "fulfilled" ? result.value : null,
        error: result.status === "rejected" ? result.reason.message : null,
      }));
    } catch (error) {
      console.error("Error in batch processing:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user-friendly AI feature descriptions
   * @returns {Object} Feature descriptions
   */
  getFeatureDescriptions() {
    return {
      playlistNames: {
        title: "Smart Playlist Names",
        description:
          "AI generates creative names based on your music selection",
        icon: "🎯",
      },
      songRecommendations: {
        title: "Song Recommendations",
        description:
          "Get personalized song suggestions that fit your playlist vibe",
        icon: "🎵",
      },
      playlistAnalysis: {
        title: "Playlist Insights",
        description:
          "Discover patterns, moods, and themes in your music collection",
        icon: "📊",
      },
      autoDescription: {
        title: "Auto Descriptions",
        description:
          "Generate engaging descriptions for sharing your playlists",
        icon: "✍️",
      },
      smartPlaylists: {
        title: "Smart Playlists",
        description: "Create playlists automatically based on your preferences",
        icon: "🤖",
      },
    };
  }
}

const aiService = new AIService();
export default aiService;
