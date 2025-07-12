const axios = require("axios");

class LastFmService {
  constructor() {
    this.apiKey = process.env.LASTFM_API_KEY;
    this.baseUrl = "http://ws.audioscrobbler.com/2.0/";
  }

  async searchTracks(query, limit = 20) {
    try {
      if (!this.apiKey) {
        throw new Error("Last.fm API key not configured");
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          method: "track.search",
          track: query,
          api_key: this.apiKey,
          format: "json",
          limit,
        },
      });

      const tracks = response.data.results?.trackmatches?.track || [];

      return Array.isArray(tracks)
        ? tracks.map((track) => ({
            name: track.name,
            artist: track.artist,
            album: track.album || "Unknown Album",
            mbid: track.mbid,
            url: track.url,
            image:
              track.image?.find((img) => img.size === "medium")?.["#text"] ||
              null,
          }))
        : [];
    } catch (error) {
      console.error("Error searching Last.fm tracks:", error);
      throw new Error("Failed to search tracks on Last.fm");
    }
  }

  async getTrackInfo(artist, track) {
    try {
      if (!this.apiKey) {
        throw new Error("Last.fm API key not configured");
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          method: "track.getInfo",
          api_key: this.apiKey,
          artist,
          track,
          format: "json",
        },
      });

      const trackInfo = response.data.track;

      return {
        name: trackInfo.name,
        artist: trackInfo.artist.name,
        album: trackInfo.album?.title || "Unknown Album",
        duration: trackInfo.duration
          ? Math.floor(trackInfo.duration / 1000)
          : null,
        playcount: trackInfo.playcount,
        listeners: trackInfo.listeners,
        url: trackInfo.url,
        image:
          trackInfo.album?.image?.find((img) => img.size === "medium")?.[
            "#text"
          ] || null,
        tags: trackInfo.toptags?.tag?.map((tag) => tag.name) || [],
      };
    } catch (error) {
      console.error("Error getting Last.fm track info:", error);
      throw new Error("Failed to get track info from Last.fm");
    }
  }

  async getArtistInfo(artist) {
    try {
      if (!this.apiKey) {
        throw new Error("Last.fm API key not configured");
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          method: "artist.getInfo",
          api_key: this.apiKey,
          artist,
          format: "json",
        },
      });

      const artistInfo = response.data.artist;

      return {
        name: artistInfo.name,
        mbid: artistInfo.mbid,
        url: artistInfo.url,
        image:
          artistInfo.image?.find((img) => img.size === "medium")?.["#text"] ||
          null,
        playcount: artistInfo.stats?.playcount,
        listeners: artistInfo.stats?.listeners,
        bio: artistInfo.bio?.summary,
        tags: artistInfo.tags?.tag?.map((tag) => tag.name) || [],
      };
    } catch (error) {
      console.error("Error getting Last.fm artist info:", error);
      throw new Error("Failed to get artist info from Last.fm");
    }
  }
}

module.exports = new LastFmService();
