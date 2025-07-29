import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://collaborative-playlist-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  registerAdmin: (adminData) => api.post("/auth/register-admin", adminData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  changePassword: (passwordData) => api.put("/auth/password", passwordData),
  deleteAccount: () => api.delete("/auth/account"),
  updateStatus: (statusData) => api.put("/auth/status", statusData),
  getActivity: () => api.get("/auth/activity"),
};

// Playlist API calls
export const playlistAPI = {
  getAll: () => api.get("/playlists"),
  getById: (id) => api.get(`/playlists/${id}`),
  create: (playlistData) => api.post("/playlists", playlistData),
  update: (id, playlistData) => api.put(`/playlists/${id}`, playlistData),
  delete: (id) => api.delete(`/playlists/${id}`),
  search: (query) => api.get(`/playlists/search?q=${query}`),
  addCollaborator: (id, collaboratorData) => api.post(`/playlists/${id}/collaborators`, collaboratorData),
  removeCollaborator: (id, userId) => api.delete(`/playlists/${id}/collaborators/${userId}`),
};

// Song API calls
export const songAPI = {
  getByPlaylist: (playlistId) => api.get(`/songs?playlistId=${playlistId}`),
  add: (songData) => api.post("/songs", songData),
  remove: (songId, playlistId) => api.delete(`/songs/${songId}?playlistId=${playlistId}`),
  search: (playlistId, query) => api.get(`/songs/search?playlistId=${playlistId}&q=${query}`),
  reorder: (reorderData) => api.put("/songs/reorder", reorderData),
};

// Music Search API calls
export const searchAPI = {
  tracks: (query, service = "spotify") => api.get(`/search/tracks?q=${encodeURIComponent(query)}&service=${service}`),
  artist: (name) => api.get(`/search/artist?name=${encodeURIComponent(name)}`),
  getTrackById: (service, id) => api.get(`/search/track/${service}/${id}`),
  spotifyAuth: () => api.get("/search/spotify/auth"),
  spotifyCallback: (code) => api.get(`/search/spotify/callback?code=${code}`),
  lastfmDemo: () => api.get("/search/lastfm/demo"),
};

// Lyrics API calls
export const lyricsAPI = {
  health: () => api.get("/lyrics/health"),
  search: (query) => api.get(`/lyrics/search?q=${encodeURIComponent(query)}`),
  getSong: (songId) => api.get(`/lyrics/song/${songId}`),
  getArtist: (artistId) => api.get(`/lyrics/artist/${artistId}`),
  findLyrics: (title, artist) => api.get(`/lyrics/find?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`),
  getTrending: () => api.get("/lyrics/trending"),
  enrich: (songId) => api.post(`/lyrics/enrich/${songId}`),
};

// RBAC API calls  
export const rbacAPI = {
  addCollaborator: (playlistId, collaboratorData) =>
    api.post(`/rbac/collaborators/${playlistId}`, collaboratorData),
  updateRole: (playlistId, userId, roleData) =>
    api.put(`/rbac/collaborators/${playlistId}/${userId}`, roleData),
  removeCollaborator: (playlistId, userId) =>
    api.delete(`/rbac/collaborators/${playlistId}/${userId}`),
  getCollaborators: (playlistId) =>
    api.get(`/rbac/collaborators/${playlistId}`),
  getPermissions: (playlistId) =>
    api.get(`/rbac/permissions/${playlistId}`),
  getRoles: () =>
    api.get(`/rbac/roles`),
  leavePlaylist: (playlistId) =>
    api.post(`/rbac/leave/${playlistId}`),
  transferOwnership: (playlistId, newOwnerId) =>
    api.post(`/rbac/transfer-ownership/${playlistId}`, { newOwnerId }),
};

// Suggestions API calls
export const suggestionsAPI = {
  create: (playlistId, suggestionData) =>
    api.post(`/suggestions/${playlistId}`, suggestionData),
  getAll: (playlistId) =>
    api.get(`/suggestions/${playlistId}`),
  approve: (playlistId, suggestionId) =>
    api.post(`/suggestions/${playlistId}/${suggestionId}/approve`),
  reject: (playlistId, suggestionId) =>
    api.post(`/suggestions/${playlistId}/${suggestionId}/reject`),
  remove: (playlistId, suggestionId) =>
    api.delete(`/suggestions/${playlistId}/${suggestionId}`),
  getMySuggestions: (playlistId) =>
    api.get(`/suggestions/my-suggestions/${playlistId}`),
};

// Cache API calls
export const cacheAPI = {
  getStats: () => api.get("/cache/stats"),
  invalidate: (keys) => api.post("/cache/invalidate", { keys }),
  flush: () => api.delete("/cache/flush"),
  getHealth: () => api.get("/cache/health"),
};

// Health API calls  
export const healthAPI = {
  getHealth: () => api.get("/health/health"),
  getInfo: () => api.get("/health/info"),
};

// Realtime API calls
export const realtimeAPI = {
  getSession: (playlistId) => api.get(`/realtime/session/${playlistId}`),
  vote: (voteData) => api.post("/realtime/vote", voteData),
  updateNowPlaying: (playlistId, songData) => api.post("/realtime/now-playing", { playlistId, ...songData }),
  sendNotification: (notificationData) => api.post("/realtime/notification", notificationData),
  getVotes: (songId) => api.get(`/realtime/votes/${songId}`),
  getActivity: (playlistId) => api.get(`/realtime/activity/${playlistId}`),
  updatePresence: (presenceData) => api.post("/realtime/presence", presenceData),
  getStats: () => api.get("/realtime/stats"),
};

export default api;
