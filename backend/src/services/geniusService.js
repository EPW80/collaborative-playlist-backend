const axios = require("axios");
const config = require("../config/index");

/**
 * @fileoverview Genius API service for fetching song lyrics and artist information
 * @module services/geniusService
 * @requires axios
 * @requires ../config/index
 */

class GeniusService {
  constructor() {
    this.baseURL = "https://api.genius.com";
    this.accessToken = config.genius?.accessToken;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "User-Agent": "CollaborativePlaylistManager/1.0",
      },
      timeout: 10000,
    });
  }

  /**
   * Search for songs on Genius
   * @param {string} query - Search query (song title and artist)
   * @returns {Promise<Object>} Search results
   */
  async searchSongs(query) {
    try {
      if (!this.accessToken) {
        throw new Error("Genius API access token not configured");
      }

      console.log(`🔍 Searching Genius for: "${query}"`);

      const response = await this.client.get("/search", {
        params: {
          q: query,
        },
      });

      const hits = response.data.response.hits;

      return {
        success: true,
        results: hits.map((hit) => ({
          id: hit.result.id,
          title: hit.result.title,
          artist: hit.result.primary_artist.name,
          artistId: hit.result.primary_artist.id,
          url: hit.result.url,
          thumbnail: hit.result.song_art_image_thumbnail_url,
          fullImage: hit.result.song_art_image_url,
          apiPath: hit.result.api_path,
          releaseDate: hit.result.release_date_for_display,
          stats: {
            hotness: hit.result.stats.hot,
            pageViews: hit.result.stats.pageviews,
          },
        })),
      };
    } catch (error) {
      console.error("❌ Genius search error:", error.message);
      return {
        success: false,
        error: error.message,
        results: [],
      };
    }
  }

  /**
   * Get detailed song information
   * @param {number} songId - Genius song ID
   * @returns {Promise<Object>} Song details
   */
  async getSongDetails(songId) {
    try {
      if (!this.accessToken) {
        throw new Error("Genius API access token not configured");
      }

      console.log(`📖 Getting song details for ID: ${songId}`);

      const response = await this.client.get(`/songs/${songId}`);
      const song = response.data.response.song;

      return {
        success: true,
        song: {
          id: song.id,
          title: song.title,
          fullTitle: song.full_title,
          artist: {
            id: song.primary_artist.id,
            name: song.primary_artist.name,
            url: song.primary_artist.url,
            image: song.primary_artist.image_url,
          },
          album: song.album
            ? {
                id: song.album.id,
                name: song.album.name,
                url: song.album.url,
                coverArt: song.album.cover_art_url,
              }
            : null,
          releaseDate: song.release_date_for_display,
          description: song.description?.plain,
          url: song.url,
          embedUrl: song.embed_content,
          thumbnail: song.song_art_image_thumbnail_url,
          fullImage: song.song_art_image_url,
          stats: {
            hotness: song.stats.hot,
            pageViews: song.stats.pageviews,
            concurrentViewers: song.stats.concurrent_viewers,
          },
          media:
            song.media?.map((media) => ({
              provider: media.provider,
              type: media.type,
              url: media.url,
            })) || [],
          featuredArtists:
            song.featured_artists?.map((artist) => ({
              id: artist.id,
              name: artist.name,
              url: artist.url,
            })) || [],
          producedBy:
            song.producer_artists?.map((producer) => ({
              id: producer.id,
              name: producer.name,
              url: producer.url,
            })) || [],
        },
      };
    } catch (error) {
      console.error("❌ Genius song details error:", error.message);
      return {
        success: false,
        error: error.message,
        song: null,
      };
    }
  }

  /**
   * Get artist information
   * @param {number} artistId - Genius artist ID
   * @returns {Promise<Object>} Artist details
   */
  async getArtistDetails(artistId) {
    try {
      if (!this.accessToken) {
        throw new Error("Genius API access token not configured");
      }

      console.log(`👤 Getting artist details for ID: ${artistId}`);

      const response = await this.client.get(`/artists/${artistId}`);
      const artist = response.data.response.artist;

      return {
        success: true,
        artist: {
          id: artist.id,
          name: artist.name,
          url: artist.url,
          image: artist.image_url,
          description: artist.description?.plain,
          followers: artist.followers_count,
          facebook: artist.facebook_name,
          instagram: artist.instagram_name,
          twitter: artist.twitter_name,
          alternateNames: artist.alternate_names || [],
          headerImage: artist.header_image_url,
        },
      };
    } catch (error) {
      console.error("❌ Genius artist details error:", error.message);
      return {
        success: false,
        error: error.message,
        artist: null,
      };
    }
  }

  /**
   * Get artist's songs
   * @param {number} artistId - Genius artist ID
   * @param {number} page - Page number (default: 1)
   * @param {number} perPage - Songs per page (default: 20, max: 50)
   * @returns {Promise<Object>} Artist's songs
   */
  async getArtistSongs(artistId, page = 1, perPage = 20) {
    try {
      if (!this.accessToken) {
        throw new Error("Genius API access token not configured");
      }

      console.log(`🎵 Getting songs for artist ID: ${artistId} (page ${page})`);

      const response = await this.client.get(`/artists/${artistId}/songs`, {
        params: {
          page,
          per_page: Math.min(perPage, 50),
          sort: "popularity",
        },
      });

      const songs = response.data.response.songs;
      const nextPage = response.data.response.next_page;

      return {
        success: true,
        songs: songs.map((song) => ({
          id: song.id,
          title: song.title,
          fullTitle: song.full_title,
          url: song.url,
          thumbnail: song.song_art_image_thumbnail_url,
          releaseDate: song.release_date_for_display,
          stats: {
            hotness: song.stats.hot,
            pageViews: song.stats.pageviews,
          },
        })),
        pagination: {
          currentPage: page,
          nextPage,
          hasMore: !!nextPage,
        },
      };
    } catch (error) {
      console.error("❌ Genius artist songs error:", error.message);
      return {
        success: false,
        error: error.message,
        songs: [],
        pagination: null,
      };
    }
  }

  /**
   * Search for song lyrics by title and artist
   * @param {string} title - Song title
   * @param {string} artist - Artist name
   * @returns {Promise<Object>} Song search result with lyrics URL
   */
  async findSongLyrics(title, artist) {
    try {
      const query = `${title} ${artist}`;
      const searchResults = await this.searchSongs(query);

      if (!searchResults.success || searchResults.results.length === 0) {
        return {
          success: false,
          message: "No lyrics found",
          data: null,
        };
      }

      // Get the best match (first result is usually most relevant)
      const bestMatch = searchResults.results[0];
      const songDetails = await this.getSongDetails(bestMatch.id);

      return {
        success: true,
        message: "Lyrics information found",
        data: {
          geniusId: bestMatch.id,
          title: bestMatch.title,
          artist: bestMatch.artist,
          url: bestMatch.url,
          thumbnail: bestMatch.thumbnail,
          fullImage: bestMatch.fullImage,
          releaseDate: bestMatch.releaseDate,
          stats: bestMatch.stats,
          details: songDetails.success ? songDetails.song : null,
          lyricsUrl: bestMatch.url,
          note: "Visit the URL to view full lyrics on Genius.com",
        },
      };
    } catch (error) {
      console.error("❌ Genius find lyrics error:", error.message);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Get trending songs
   * @returns {Promise<Object>} Trending songs
   */
  async getTrendingSongs() {
    try {
      if (!this.accessToken) {
        throw new Error("Genius API access token not configured");
      }

      // Search for popular/trending songs (Genius doesn't have a direct trending endpoint)
      const trendingQueries = ["trending", "popular", "hit songs 2025"];
      const results = [];

      for (const query of trendingQueries) {
        const searchResult = await this.searchSongs(query);
        if (searchResult.success) {
          results.push(...searchResult.results.slice(0, 5));
        }
      }

      // Remove duplicates and sort by stats
      const uniqueSongs = results
        .filter(
          (song, index, self) =>
            index === self.findIndex((s) => s.id === song.id)
        )
        .sort((a, b) => b.stats.pageViews - a.stats.pageViews);

      return {
        success: true,
        songs: uniqueSongs.slice(0, 20),
      };
    } catch (error) {
      console.error("❌ Genius trending songs error:", error.message);
      return {
        success: false,
        error: error.message,
        songs: [],
      };
    }
  }

  /**
   * Check if Genius API is configured and accessible
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    try {
      if (!this.accessToken) {
        return {
          status: "error",
          message: "Genius API access token not configured",
          configured: false,
        };
      }

      // Test with a simple search
      const response = await this.client.get("/search", {
        params: { q: "test" },
      });

      return {
        status: "healthy",
        message: "Genius API is accessible",
        configured: true,
        responseTime: response.headers["x-response-time"] || "unknown",
      };
    } catch (error) {
      return {
        status: "error",
        message: `Genius API error: ${error.message}`,
        configured: !!this.accessToken,
      };
    }
  }
}

module.exports = new GeniusService();
