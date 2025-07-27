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
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
};

// Playlist API calls
export const playlistAPI = {
  getAll: () => api.get("/playlists"),
  getById: (id) => api.get(`/playlists/${id}`),
  create: (playlistData) => api.post("/playlists", playlistData),
  update: (id, playlistData) => api.put(`/playlists/${id}`, playlistData),
  delete: (id) => api.delete(`/playlists/${id}`),
  search: (query) => api.get(`/playlists/search?q=${query}`),
};

// RBAC API calls
export const rbacAPI = {
  addCollaborator: (playlistId, collaboratorData) =>
    api.post(`/rbac/playlists/${playlistId}/collaborators`, collaboratorData),
  updateRole: (playlistId, userId, roleData) =>
    api.put(`/rbac/playlists/${playlistId}/collaborators/${userId}`, roleData),
  removeCollaborator: (playlistId, userId) =>
    api.delete(`/rbac/playlists/${playlistId}/collaborators/${userId}`),
  getPermissions: (playlistId) =>
    api.get(`/rbac/playlists/${playlistId}/permissions`),
};

// Suggestions API calls
export const suggestionsAPI = {
  create: (playlistId, suggestionData) =>
    api.post(`/suggestions/playlists/${playlistId}`, suggestionData),
  approve: (playlistId, suggestionId) =>
    api.put(`/suggestions/playlists/${playlistId}/${suggestionId}/approve`),
  reject: (playlistId, suggestionId) =>
    api.put(`/suggestions/playlists/${playlistId}/${suggestionId}/reject`),
  getPending: (playlistId) =>
    api.get(`/suggestions/playlists/${playlistId}/pending`),
};

export default api;
