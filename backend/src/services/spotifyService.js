const SpotifyWebApi = require("spotify-web-api-node");
const axios = require("axios");

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
      await this.getClientCredentialsToken();

      const data = await this.spotifyApi.searchTracks(query, { limit });

      return data.body.tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        duration: Math.floor(track.duration_ms / 1000),
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        image: track.album.images[0]?.url || null,
      }));
    } catch (error) {
      console.error("Error searching Spotify tracks:", error);
      throw new Error("Failed to search tracks on Spotify");
    }
  }

  async getTrack(trackId) {
    try {
      await this.getClientCredentialsToken();

      const data = await this.spotifyApi.getTrack(trackId);
      const track = data.body;

      return {
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        duration: Math.floor(track.duration_ms / 1000),
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        image: track.album.images[0]?.url || null,
      };
    } catch (error) {
      console.error("Error getting Spotify track:", error);
      throw new Error("Failed to get track from Spotify");
    }
  }

  getAuthURL(state) {
    const scopes = [
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-read-private",
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
}

module.exports = new SpotifyService();
