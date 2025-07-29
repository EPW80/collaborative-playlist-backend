const SpotifyWebApi = require("spotify-web-api-node");
const axios = require("axios");
const cacheService = require("./cacheService");

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  async getClientCredentialsToken() {
    try {
      if (
        this.accessToken &&
        this.tokenExpiresAt &&
        Date.now() < this.tokenExpiresAt
      ) {
        return this.accessToken;
      }

      const data = await this.spotifyApi.clientCredentialsGrant();
      this.accessToken = data.body.access_token;
      this.tokenExpiresAt = Date.now() + data.body.expires_in * 1000 - 60000; // Refresh 1 minute early

      this.spotifyApi.setAccessToken(this.accessToken);
      return this.accessToken;
    } catch (error) {
      console.error("Error getting Spotify token:", error);
      throw new Error("Failed to authenticate with Spotify");
    }
  }

  async searchTracks(query, limit = 20) {
    try {
      // Check cache first
      const cacheKey = cacheService.keys.spotifySearch(query, limit);
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      await this.getClientCredentialsToken();

      const data = await this.spotifyApi.searchTracks(query, { limit });

      const results = data.body.tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        duration: Math.floor(track.duration_ms / 1000),
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        image: track.album.images[0]?.url || null,
        popularity: track.popularity,
        explicit: track.explicit,
        uri: track.uri,
      }));

      // Cache results for 1 hour
      await cacheService.set(cacheKey, results, 3600);

      return results;
    } catch (error) {
      console.error("Error searching Spotify tracks:", error);
      throw new Error("Failed to search tracks on Spotify");
    }
  }

  async getTrack(trackId) {
    try {
      // Check cache first
      const cacheKey = cacheService.keys.spotifyTrack(trackId);
      const cachedTrack = await cacheService.get(cacheKey);
      if (cachedTrack) {
        return cachedTrack;
      }

      await this.getClientCredentialsToken();

      const data = await this.spotifyApi.getTrack(trackId);
      const track = data.body;

      const result = {
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        duration: Math.floor(track.duration_ms / 1000),
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        image: track.album.images[0]?.url || null,
        popularity: track.popularity,
        explicit: track.explicit,
        uri: track.uri,
      };

      // Cache track for 24 hours
      await cacheService.set(cacheKey, result, 86400);

      return result;
    } catch (error) {
      console.error("Error getting Spotify track:", error);
      throw new Error("Failed to get track from Spotify");
    }
  }

  getAuthURL(state) {
    const scopes = [
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-public",
      "playlist-modify-private",
      "user-read-private",
      "user-read-email",
      "user-library-read",
      "user-top-read",
    ];
    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  async exchangeCodeForToken(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      return {
        access_token: data.body.access_token,
        refresh_token: data.body.refresh_token,
        expires_in: data.body.expires_in,
      };
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      throw new Error("Failed to exchange code for token");
    }
  }

  async refreshUserToken(refreshToken) {
    try {
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      
      return {
        access_token: data.body.access_token,
        expires_in: data.body.expires_in,
      };
    } catch (error) {
      console.error("Error refreshing Spotify token:", error);
      throw new Error("Failed to refresh Spotify token");
    }
  }

  async getUserPlaylists(accessToken) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getUserPlaylists();
      
      return data.body.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        public: playlist.public,
        collaborative: playlist.collaborative,
        track_count: playlist.tracks.total,
        owner: playlist.owner.display_name,
        images: playlist.images,
        external_urls: playlist.external_urls,
      }));
    } catch (error) {
      console.error("Error getting user playlists:", error);
      throw new Error("Failed to get user playlists");
    }
  }
}

module.exports = new SpotifyService();

module.exports = new SpotifyService();
