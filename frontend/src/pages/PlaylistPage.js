import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Skeleton,
  Slider,
  Card,
  CardContent,
  Switch,
  Avatar,
  LinearProgress,
  Fade,
  Grow,
  Slide,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  Select,
  FormControl,
  InputLabel,
  ListItemIcon,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // Use Grid with new responsive syntax
import {
  ArrowBack,
  People,
  Settings,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  Brightness7,
  Brightness4,
  AccountTree,
  Security,
  Speed,
  Add as AddIcon,
  MusicNote,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { playlistAPI, songAPI, rbacAPI } from "../services/api";
import socketService from "../services/websocket";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import MusicSearch from "../components/MusicSearch";

// Blockchain-inspired theme
const createBlockchainTheme = (darkMode) => {
  return createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#00e676" : "#1976d2",
        light: darkMode ? "#66ffa6" : "#42a5f5",
        dark: darkMode ? "#00c853" : "#1565c0",
      },
      secondary: {
        main: darkMode ? "#ff6d00" : "#ed6c02",
        light: darkMode ? "#ff9800" : "#ff9800",
        dark: darkMode ? "#e65100" : "#e65100",
      },
      background: {
        default: darkMode ? "#0a0a0a" : "#f5f5f5",
        paper: darkMode ? "#1a1a1a" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#00e676" : "#1976d2",
        secondary: darkMode ? "#b0bec5" : "#546e7a",
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: darkMode
              ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: darkMode ? "1px solid #00e676" : "1px solid #e0e0e0",
            borderRadius: "12px",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: darkMode
                ? "0 8px 25px rgba(0, 230, 118, 0.2)"
                : "0 8px 25px rgba(0, 0, 0, 0.1)",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            textTransform: "none",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-1px)",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: "6px",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "scale(1.05)",
            },
          },
        },
      },
    },
  });
};

// Loading Skeleton Component
const PlaylistSkeleton = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="80%" height={24} />
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={80} height={24} />
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={120} height={24} />
          </Box>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" width="30%" height={32} />
          {[...Array(3)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", py: 1 }}>
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ mr: 2 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="50%" />
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="text" width="50%" height={32} />
          {[...Array(2)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", py: 1 }}>
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ mr: 2 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" />
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  </Container>
);

// Enhanced Song Player Component
const SongPlayer = ({
  currentSong,
  isPlaying,
  onPlayPause,
  darkMode,
  currentTime = 0,
  duration = 0,
  volume = 50,
  onVolumeChange,
  onSeek,
  isLoading = false,
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (event) => {
    if (!duration || !onSeek) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    onSeek(newTime);
  };

  return (
    <Fade in={true} timeout={500}>
      <Card
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: darkMode
            ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          borderTop: darkMode ? "2px solid #00e676" : "2px solid #1976d2",
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          onClick={handleProgressClick}
          sx={{
            height: 4,
            cursor: "pointer",
            "& .MuiLinearProgress-bar": {
              background: darkMode
                ? "linear-gradient(90deg, #00e676, #00c853)"
                : "linear-gradient(90deg, #1976d2, #1565c0)",
            },
          }}
        />
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: darkMode
                ? "linear-gradient(135deg, #00e676, #00c853)"
                : "linear-gradient(135deg, #1976d2, #1565c0)",
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <AccountTree />
            )}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {currentSong?.title || "No song selected"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentSong?.artist || "Unknown Artist"}
            </Typography>
            {duration > 0 && (
              <Typography variant="caption" color="text.secondary">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton color="primary">
              <SkipPrevious />
            </IconButton>
            <IconButton
              color="primary"
              onClick={onPlayPause}
              disabled={!currentSong || isLoading}
              sx={{
                transform: "scale(1.2)",
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.3)" },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isPlaying ? (
                <Pause />
              ) : (
                <PlayArrow />
              )}
            </IconButton>
            <IconButton color="primary">
              <SkipNext />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 120,
            }}
          >
            <VolumeUp color="primary" />
            <Slider
              size="small"
              value={volume}
              onChange={(_, value) => onVolumeChange && onVolumeChange(value)}
              sx={{
                "& .MuiSlider-thumb": {
                  background: darkMode ? "#00e676" : "#1976d2",
                },
                "& .MuiSlider-track": {
                  background: darkMode
                    ? "linear-gradient(90deg, #00e676, #00c853)"
                    : "linear-gradient(90deg, #1976d2, #1565c0)",
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Default to blockchain dark theme
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicSearchOpen, setMusicSearchOpen] = useState(false);

  // CRUD operation states
  const [editPlaylistOpen, setEditPlaylistOpen] = useState(false);
  const [deletePlaylistOpen, setDeletePlaylistOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [songMenuAnchor, setSongMenuAnchor] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);

  // Collaborator management states
  const [collaboratorManageOpen, setCollaboratorManageOpen] = useState(false);
  const [addCollaboratorOpen, setAddCollaboratorOpen] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState({
    email: "",
    username: "",
    role: "viewer",
  });
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);
  const [collaboratorErrors, setCollaboratorErrors] = useState({});

  // Audio playback states
  const audioRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  // Track recently added songs to prevent duplicate processing
  const recentlyAddedSongs = useRef(new Set());
  
  // Track if we're currently loading/playing audio to prevent race conditions
  const isAudioOperationInProgress = useRef(false);
  
  // Track current audio operation to allow cancellation
  const currentAudioOperation = useRef(null);

  // Helper functions
  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Audio event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Note: Auto-play next song would be handled by parent component
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e) => {
      console.error("Audio error:", e);
      setIsLoading(false);
      setIsPlaying(false);
      // Reset audio operation flags on error
      isAudioOperationInProgress.current = false;
      if (currentAudioOperation.current) {
        currentAudioOperation.current.abort();
        currentAudioOperation.current = null;
      }
      showSnackbar(
        "Error playing audio. This song may not have a preview available.",
        "error"
      );
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      // Cancel any ongoing audio operations
      if (currentAudioOperation.current) {
        currentAudioOperation.current.abort();
      }
      
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.pause();
      // Reset audio operation flag on cleanup
      isAudioOperationInProgress.current = false;
      currentAudioOperation.current = null;
    };
  }, [playlist?.songs, currentSong?._id, showSnackbar]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Close menus when user permissions change to prevent anchor element issues
  useEffect(() => {
    // Close menus when permissions might cause anchor elements to be removed
    setMenuAnchor(null);
    setSongMenuAnchor(null);
  }, [userPermissions?.permissions, userPermissions?.role]);

  // Safety cleanup for invalid anchor elements
  useEffect(() => {
    const checkAnchors = () => {
      if (menuAnchor && !menuAnchor.isConnected) {
        setMenuAnchor(null);
      }
      if (songMenuAnchor && !songMenuAnchor.isConnected) {
        setSongMenuAnchor(null);
      }
    };

    const interval = setInterval(checkAnchors, 100);
    return () => clearInterval(interval);
  }, [menuAnchor, songMenuAnchor]);

  // Helper function to add a song with proper duplicate checking
  const addSongToPlaylist = useCallback((newSong, source = "unknown") => {
    const songIdentifier = `${newSong._id || newSong.id}-${newSong.title}-${newSong.artist}`;
    
    // Check if we recently processed this song (within last 2 seconds)
    if (recentlyAddedSongs.current.has(songIdentifier)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Song recently processed from ${source}, skipping duplicate`);
      }
      return false;
    }

    // Track this song as recently processed
    recentlyAddedSongs.current.add(songIdentifier);
    setTimeout(() => {
      recentlyAddedSongs.current.delete(songIdentifier);
    }, 2000); // Clear after 2 seconds

    setPlaylist((prev) => {
      if (!prev) {
        console.warn("Playlist not loaded yet, cannot add song");
        return prev;
      }

      // Check if song already exists in the playlist
      const songExists = prev.songs.some((existingSong) => {
        const existingId = existingSong._id || existingSong.id;
        const newId = newSong._id || newSong.id;
        return (
          existingId === newId ||
          (existingSong.title === newSong.title &&
            existingSong.artist === newSong.artist)
        );
      });

      if (songExists) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Song already exists in playlist (${source})`);
        }
        return prev;
      }

      console.log(`✅ Added song from ${source}:`, newSong.title, "by", newSong.artist);
      return {
        ...prev,
        songs: [...(prev.songs || []), newSong],
      };
    });
    
    return true;
  }, []);

  const handleSongAdded = useCallback((newSong) => {
    addSongToPlaylist(newSong, "MusicSearch");
  }, [addSongToPlaylist]);

  const handleOpenMusicSearch = () => {
    setMusicSearchOpen(true);
  };

  const handleCloseMusicSearch = () => {
    setMusicSearchOpen(false);
  };

  // CRUD Handler Functions
  const handleEditPlaylist = () => {
    setEditingPlaylist({
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic,
    });
    setEditPlaylistOpen(true);
    setMenuAnchor(null);
  };

  const handleUpdatePlaylist = async () => {
    try {
      const response = await playlistAPI.update(id, editingPlaylist);
      setPlaylist(response.data.data.playlist);
      setEditPlaylistOpen(false);
      showSnackbar("Playlist updated successfully!");
    } catch (error) {
      console.error("Error updating playlist:", error);
      showSnackbar("Failed to update playlist", "error");
    }
  };

  const handleDeletePlaylist = async () => {
    try {
      await playlistAPI.delete(id);
      setDeletePlaylistOpen(false);
      showSnackbar("Playlist deleted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting playlist:", error);
      showSnackbar("Failed to delete playlist", "error");
    }
  };

  const handleDeleteSong = async (songId) => {
    try {
      // Check if we have a valid song ID
      if (!songId) {
        console.error("No valid song ID provided for deletion");
        console.log("Selected song:", selectedSong);
        console.log(
          "Available song properties:",
          selectedSong
            ? Object.keys(selectedSong)
            : "selectedSong is null/undefined"
        );
        showSnackbar("Failed to remove song: Invalid song ID", "error");
        return;
      }

      // Check if user has permission to delete songs
      if (
        !userPermissions?.permissions?.canRemoveSongs &&
        !userPermissions?.permissions?.canEdit
      ) {
        console.error("User does not have permission to remove songs");
        showSnackbar(
          "You don't have permission to remove songs from this playlist",
          "error"
        );
        return;
      }

      console.log("Attempting to delete song with ID:", songId);
      console.log("Selected song object:", selectedSong);

      await songAPI.remove(songId, id);
      setPlaylist((prev) => ({
        ...prev,
        songs: prev.songs.filter((song) => {
          const currentSongId = song._id || song.id;
          return currentSongId !== songId;
        }),
      }));
      setSongMenuAnchor(null);
      setSelectedSong(null);
      showSnackbar("Song removed from playlist!");
    } catch (error) {
      console.error("Error removing song:", error);
      showSnackbar("Failed to remove song", "error");
    }
  };

  // Collaborator Management Functions
  const handleManageCollaborators = () => {
    setCollaboratorManageOpen(true);
  };

  const handleAddCollaborator = async () => {
    setCollaboratorErrors({});

    // Validation
    const errors = {};
    if (!newCollaborator.email && !newCollaborator.username) {
      errors.identifier = "Either email or username is required";
    }
    if (!newCollaborator.role) {
      errors.role = "Role is required";
    }

    if (Object.keys(errors).length > 0) {
      setCollaboratorErrors(errors);
      return;
    }

    setCollaboratorLoading(true);
    try {
      const collaboratorData = {
        email: newCollaborator.email || undefined,
        username: newCollaborator.username || undefined,
        role: newCollaborator.role,
      };

      const response = await rbacAPI.addCollaborator(id, collaboratorData);

      // Update playlist collaborators
      setPlaylist((prev) => ({
        ...prev,
        collaborators: [
          ...(prev.collaborators || []),
          response.data.data.collaborator,
        ],
      }));

      // Reset form
      setNewCollaborator({ email: "", username: "", role: "viewer" });
      setAddCollaboratorOpen(false);
      showSnackbar("Collaborator added successfully!", "success");
    } catch (error) {
      console.error("Error adding collaborator:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add collaborator";
      showSnackbar(errorMessage, "error");
    } finally {
      setCollaboratorLoading(false);
    }
  };

  const handleUpdateCollaboratorRole = async (userId, newRole) => {
    setCollaboratorLoading(true);
    try {
      await rbacAPI.updateCollaboratorRole(id, userId, { role: newRole });

      // Update playlist collaborators
      setPlaylist((prev) => ({
        ...prev,
        collaborators: prev.collaborators.map((collab) =>
          collab.user._id === userId ? { ...collab, role: newRole } : collab
        ),
      }));

      showSnackbar("Collaborator role updated successfully!", "success");
    } catch (error) {
      console.error("Error updating collaborator role:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update collaborator role";
      showSnackbar(errorMessage, "error");
    } finally {
      setCollaboratorLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${username} from this playlist?`
      )
    ) {
      return;
    }

    setCollaboratorLoading(true);
    try {
      await rbacAPI.removeCollaborator(id, userId);

      // Update playlist collaborators
      setPlaylist((prev) => ({
        ...prev,
        collaborators: prev.collaborators.filter(
          (collab) => collab.user._id !== userId
        ),
      }));

      showSnackbar("Collaborator removed successfully!", "success");
    } catch (error) {
      console.error("Error removing collaborator:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to remove collaborator";
      showSnackbar(errorMessage, "error");
    } finally {
      setCollaboratorLoading(false);
    }
  };

  const theme = createBlockchainTheme(darkMode);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const response = await playlistAPI.getById(id);
        const playlistData = response.data.data.playlist;

        // Ensure songs is always an array
        if (!playlistData.songs) {
          playlistData.songs = [];
        }

        // Remove any potential duplicates from the initial data
        const uniqueSongs = playlistData.songs.filter(
          (song, index, self) =>
            index ===
            self.findIndex((s) => {
              const sId = s._id || s.id;
              const songId = song._id || song.id;
              return (
                sId === songId ||
                (s.title === song.title && s.artist === song.artist)
              );
            })
        );

        playlistData.songs = uniqueSongs;

        setPlaylist(playlistData);
        setUserPermissions(playlistData.userAccess);

        if (playlistData.songs?.length > 0) {
          setCurrentSong(playlistData.songs[0]);
        }

        // Join playlist room for real-time updates
        socketService.joinPlaylist(id);

        // Set up real-time listeners with animations
        socketService.onPlaylistUpdate((updatedPlaylist) => {
          // Ensure songs is always an array
          if (!updatedPlaylist.songs) {
            updatedPlaylist.songs = [];
          }
          setPlaylist(updatedPlaylist);
        });

        socketService.onSongAdded((data) => {
          addSongToPlaylist(data.song, "WebSocket");
        });

        socketService.onCollaboratorAdded((data) => {
          setPlaylist((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              collaborators: [...(prev.collaborators || []), data.collaborator],
            };
          });
        });
      } catch (error) {
        console.error("Error loading playlist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylist();

    return () => {
      socketService.leavePlaylist(id);
      socketService.removeAllListeners();
    };
  }, [id, addSongToPlaylist]);

  const getRoleBadgeColor = (role) => {
    const colors = {
      owner: "error",
      admin: "warning",
      editor: "info",
      contributor: "success",
      viewer: "default",
    };
    return colors[role] || "default";
  };

  const handleSongPlay = async (song) => {
    if (!audioRef.current) return;

    // If clicking the same song that's already playing, just toggle play/pause
    const currentSongId = currentSong?._id || currentSong?.id;
    const newSongId = song._id || song.id;
    if (currentSong && currentSongId === newSongId && isPlaying) {
      handlePlayPause();
      return;
    }

    // Cancel any ongoing audio operation
    if (currentAudioOperation.current) {
      currentAudioOperation.current.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    currentAudioOperation.current = abortController;

    // Prevent concurrent audio operations
    if (isAudioOperationInProgress.current) {
      console.debug("Audio operation already in progress, cancelling previous");
    }

    isAudioOperationInProgress.current = true;

    try {
      // Stop current audio completely
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        
        // Wait for pause to complete and check if operation was cancelled
        await new Promise(resolve => setTimeout(resolve, 100));
        if (abortController.signal.aborted) return;
      }

      setCurrentSong(song);
      setIsLoading(true);

      // Try to find a preview URL for the song
      let audioUrl = null;

      // Check if song has metadata with preview URL
      if (song.metadata?.previewUrl) {
        audioUrl = song.metadata.previewUrl;
        showSnackbar(
          `Playing preview for "${song.title}" by ${song.artist}`,
          "info"
        );
      }
      // For Spotify songs without preview, use a demo audio
      else if (song.spotifyId) {
        showSnackbar(
          `Preview not available for "${song.title}" - playing demo audio`,
          "warning"
        );
        // Use a reliable demo audio file
        audioUrl = "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3";
      }
      // For other sources, use demo audio
      else {
        showSnackbar(
          `Playing demo audio for "${song.title}" by ${song.artist}`,
          "warning"
        );
        // Use a different demo audio file for variety
        audioUrl = "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg";
      }

      if (!audioUrl) {
        showSnackbar("Audio preview not available for this song.", "warning");
        return;
      }

      // Check if operation was cancelled before proceeding
      if (abortController.signal.aborted) return;

      // Reset and load new audio source
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;

      // Wait for audio to be ready with cancellation support
      await new Promise((resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new Error("Operation cancelled"));
          return;
        }

        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error("Audio loading timeout"));
        }, 8000);

        const cleanup = () => {
          clearTimeout(timeout);
          audioRef.current.removeEventListener("canplay", onCanPlay);
          audioRef.current.removeEventListener("error", onError);
        };

        const onCanPlay = () => {
          cleanup();
          resolve();
        };

        const onError = (error) => {
          cleanup();
          reject(error);
        };

        // Handle cancellation
        abortController.signal.addEventListener('abort', () => {
          cleanup();
          reject(new Error("Operation cancelled"));
        });

        audioRef.current.addEventListener("canplay", onCanPlay, { once: true });
        audioRef.current.addEventListener("error", onError, { once: true });

        // Trigger loading
        audioRef.current.load();
      });

      // Final check before playing
      if (abortController.signal.aborted) return;

      // Play the audio
      try {
        await audioRef.current.play();
        // Only update state if operation wasn't cancelled
        if (!abortController.signal.aborted) {
          setIsPlaying(true);
        }
      } catch (playError) {
        // If this specific operation was cancelled, don't show error
        if (abortController.signal.aborted) return;
        throw playError;
      }

    } catch (error) {
      // Don't log errors for cancelled operations
      if (abortController.signal.aborted || error.message === "Operation cancelled") {
        return;
      }
      
      console.error("Error playing audio:", error);
      
      // Filter out common browser errors
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        showSnackbar(
          "Failed to play audio. Preview may not be available.",
          "error"
        );
      }
      setIsPlaying(false);
    } finally {
      // Only reset states if this operation wasn't superseded
      if (currentAudioOperation.current === abortController) {
        setIsLoading(false);
        isAudioOperationInProgress.current = false;
        currentAudioOperation.current = null;
      }
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !currentSong) return;

    // Cancel any ongoing audio loading operation
    if (currentAudioOperation.current) {
      currentAudioOperation.current.abort();
      currentAudioOperation.current = null;
    }

    // Prevent concurrent audio operations
    if (isAudioOperationInProgress.current) {
      console.debug("Audio operation in progress, completing current operation first");
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Simple play for existing loaded audio
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
      // Only show user-facing errors for non-abort errors
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        showSnackbar("Error controlling playback", "error");
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <AppBar
            position="static"
            sx={{
              background: darkMode
                ? "linear-gradient(135deg, #1a1a1a, #2d2d2d)"
                : "linear-gradient(135deg, #1976d2, #1565c0)",
            }}
          >
            <Toolbar>
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ mr: 2 }}
              />
              <Skeleton
                variant="text"
                width="30%"
                height={32}
                sx={{ mr: "auto" }}
              />
              <Skeleton variant="rectangular" width={80} height={24} />
            </Toolbar>
          </AppBar>
          <PlaylistSkeleton />
        </Box>
      </ThemeProvider>
    );
  }

  if (!playlist) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Typography variant="h6">Playlist not found</Typography>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
        {/* Enhanced App Bar with Blockchain Design */}
        <AppBar
          position="static"
          sx={{
            background: darkMode
              ? "linear-gradient(135deg, #1a1a1a, #2d2d2d)"
              : "linear-gradient(135deg, #1976d2, #1565c0)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate("/dashboard")}
              sx={{
                mr: 2,
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "rotate(-180deg)" },
              }}
            >
              <ArrowBack />
            </IconButton>

            <Security sx={{ mr: 1, color: darkMode ? "#00e676" : "#ffffff" }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: "bold" }}
            >
              {playlist.name}
            </Typography>

            <Chip
              icon={<Speed />}
              label={userPermissions?.role || "viewer"}
              color={getRoleBadgeColor(userPermissions?.role)}
              size="small"
              sx={{ mr: 2 }}
            />

            {/* Playlist Actions Menu */}
            {(userPermissions?.permissions?.canEdit ||
              userPermissions?.role === "owner") && (
              <IconButton
                color="inherit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const target = e.currentTarget;
                  
                  // Ensure the element is still in the DOM before setting as anchor
                  if (target && target.parentNode && target.isConnected) {
                    setMenuAnchor(target);
                  }
                }}
                sx={{ mr: 1 }}
              >
                <MoreVertIcon />
              </IconButton>
            )}

            {/* Dark Mode Toggle */}
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              <Brightness7 sx={{ mr: 1 }} />
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                color="default"
              />
              <Brightness4 sx={{ ml: 1 }} />
            </Box>

            {userPermissions?.permissions?.canManageSettings && (
              <IconButton color="inherit">
                <Settings />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>

        {/* Main Content with Animations */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Playlist Info with Slide Animation */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Slide direction="up" in={true} timeout={500}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <AccountTree
                      sx={{ mr: 2, fontSize: 40, color: "primary.main" }}
                    />
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                      {playlist.name}
                    </Typography>
                  </Box>

                  <Typography variant="body1" color="text.secondary" paragraph>
                    {playlist.description || "A decentralized music collection"}
                  </Typography>

                  <Box
                    sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
                  >
                    <Chip
                      icon={<Speed />}
                      label={`${playlist.songs?.length || 0} tracks`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      icon={<Security />}
                      label={
                        playlist.isPublic ? "Public Chain" : "Private Chain"
                      }
                      size="small"
                      color={playlist.isPublic ? "success" : "warning"}
                    />
                    <Chip
                      label={`Minted by ${playlist.creator?.username}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Paper>
              </Slide>

              {/* Enhanced Songs List */}
              <Grow in={true} timeout={800}>
                <Paper sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      Music Blocks
                    </Typography>
                    {userPermissions?.permissions?.canEdit && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenMusicSearch}
                        sx={{
                          background: darkMode
                            ? "linear-gradient(135deg, #00e676, #00c853)"
                            : "linear-gradient(135deg, #1976d2, #1565c0)",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        Add Music
                      </Button>
                    )}
                  </Box>

                  {!playlist?.songs || playlist.songs.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <AccountTree
                        sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No music blocks in this chain yet
                      </Typography>
                      {userPermissions?.permissions?.canEdit && (
                        <Button
                          variant="outlined"
                          startIcon={<MusicNote />}
                          onClick={handleOpenMusicSearch}
                          sx={{ mt: 2 }}
                        >
                          Add Your First Song
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <List>
                      {playlist.songs?.map((song, index) => (
                        <Fade
                          in={true}
                          timeout={300 + index * 100}
                          key={song._id || song.id || `song-${index}`}
                        >
                          <ListItem
                            divider
                            sx={{
                              borderRadius: 2,
                              mb: 1,
                              transition: "all 0.3s ease-in-out",
                              "&:hover": {
                                transform: "translateX(8px)",
                                bgcolor: darkMode
                                  ? "rgba(0, 230, 118, 0.1)"
                                  : "rgba(25, 118, 210, 0.1)",
                              },
                            }}
                          >
                            <Avatar
                              sx={{
                                mr: 2,
                                background: darkMode
                                  ? "linear-gradient(135deg, #00e676, #00c853)"
                                  : "linear-gradient(135deg, #1976d2, #1565c0)",
                              }}
                            >
                              {index + 1}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight="bold">
                                  {song.title || `Track ${index + 1}`}
                                </Typography>
                              }
                              secondary={song.artist || "Unknown Artist"}
                            />
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <IconButton
                                color="primary"
                                onClick={() => handleSongPlay(song)}
                                sx={{
                                  transition: "transform 0.2s ease-in-out",
                                  "&:hover": { transform: "scale(1.2)" },
                                }}
                              >
                                <PlayArrow />
                              </IconButton>
                              {(userPermissions?.permissions?.canEdit ||
                                userPermissions?.permissions
                                  ?.canRemoveSongs) && (
                                <IconButton
                                  color="error"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const target = e.currentTarget;
                                    
                                    // Ensure the element is still in the DOM before setting as anchor
                                    if (target && target.parentNode && target.isConnected) {
                                      console.log("Setting selected song:", song);
                                      console.log(
                                        "Song ID:",
                                        song._id || song.id
                                      );
                                      setSelectedSong(song);
                                      setSongMenuAnchor(target);
                                    }
                                  }}
                                  sx={{
                                    transition: "transform 0.2s ease-in-out",
                                    "&:hover": { transform: "scale(1.2)" },
                                  }}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              )}
                            </Box>
                          </ListItem>
                        </Fade>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* Enhanced Sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              {/* Collaborators with Animation */}
              <Slide direction="left" in={true} timeout={600}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <People sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight="bold">
                      Chain Validators
                    </Typography>
                  </Box>

                  <List dense>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: "rgba(255, 0, 0, 0.1)",
                      }}
                    >
                      <Avatar sx={{ mr: 2, bgcolor: "error.main" }}>
                        {playlist.creator?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold">
                            {playlist.creator?.username}
                          </Typography>
                        }
                        secondary="Genesis Block Creator"
                      />
                      <Chip label="owner" color="error" size="small" />
                    </ListItem>

                    {playlist.collaborators?.map((collaborator, index) => (
                      <Fade in={true} timeout={400 + index * 150} key={index}>
                        <ListItem sx={{ borderRadius: 2, mb: 1 }}>
                          <Avatar sx={{ mr: 2 }}>
                            {collaborator.user?.username
                              ?.charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          <ListItemText
                            primary={
                              collaborator.user?.username || "Unknown User"
                            }
                            secondary={`${collaborator.role} validator`}
                          />
                          <Chip
                            label={collaborator.role}
                            color={getRoleBadgeColor(collaborator.role)}
                            size="small"
                          />
                        </ListItem>
                      </Fade>
                    ))}
                  </List>

                  {userPermissions?.permissions?.canManageCollaborators && (
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={handleManageCollaborators}
                      startIcon={<PersonAddIcon />}
                    >
                      Manage Validators
                    </Button>
                  )}
                </Paper>
              </Slide>

              {/* Enhanced Permissions */}
              <Slide direction="left" in={true} timeout={800}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Your Node Permissions
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {Object.entries(userPermissions?.permissions || {}).map(
                      ([permission, allowed]) => (
                        <Fade in={true} timeout={600} key={permission}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              p: 1,
                              borderRadius: 1,
                              bgcolor: allowed
                                ? darkMode
                                  ? "rgba(0, 230, 118, 0.1)"
                                  : "rgba(25, 118, 210, 0.1)"
                                : "transparent",
                            }}
                          >
                            <Typography variant="body2" fontWeight="medium">
                              {permission
                                .replace("can", "")
                                .replace(/([A-Z])/g, " $1")
                                .toLowerCase()}
                            </Typography>
                            <Chip
                              label={allowed ? "Granted" : "Denied"}
                              size="small"
                              color={allowed ? "success" : "default"}
                              variant={allowed ? "filled" : "outlined"}
                            />
                          </Box>
                        </Fade>
                      )
                    )}
                  </Box>
                </Paper>
              </Slide>
            </Grid>
          </Grid>
        </Container>

        {/* Enhanced Song Player */}
        {currentSong && (
          <SongPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            darkMode={darkMode}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeek}
            isLoading={isLoading}
          />
        )}

        {/* Music Search Modal */}
        <MusicSearch
          open={musicSearchOpen}
          onClose={handleCloseMusicSearch}
          playlistId={id}
          onSongAdded={handleSongAdded}
          existingSongs={playlist?.songs || []}
        />

        {/* Playlist Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor) && menuAnchor?.isConnected}
          onClose={() => setMenuAnchor(null)}
          disablePortal={false}
          keepMounted={false}
        >
          <MenuItem onClick={handleEditPlaylist}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Playlist
          </MenuItem>
          {userPermissions?.role === "owner" && (
            <MenuItem
              onClick={() => {
                setDeletePlaylistOpen(true);
                setMenuAnchor(null);
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Delete Playlist
            </MenuItem>
          )}
        </Menu>

        {/* Song Actions Menu */}
        <Menu
          anchorEl={songMenuAnchor}
          open={Boolean(songMenuAnchor) && songMenuAnchor?.isConnected}
          onClose={() => setSongMenuAnchor(null)}
          disablePortal={false}
          keepMounted={false}
        >
          {selectedSong &&
            (userPermissions?.permissions?.canRemoveSongs ||
              userPermissions?.permissions?.canEdit) && (
              <MenuItem
                onClick={() =>
                  handleDeleteSong(selectedSong?._id || selectedSong?.id)
                }
                sx={{ color: "error.main" }}
              >
                <DeleteIcon sx={{ mr: 1 }} />
                Remove from Playlist
              </MenuItem>
            )}
        </Menu>

        {/* Edit Playlist Dialog */}
        <Dialog
          open={editPlaylistOpen}
          onClose={() => setEditPlaylistOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Playlist</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Playlist Name"
              value={editingPlaylist.name || ""}
              onChange={(e) =>
                setEditingPlaylist((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={editingPlaylist.description || ""}
              onChange={(e) =>
                setEditingPlaylist((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              margin="normal"
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editingPlaylist.isPublic || false}
                  onChange={(e) =>
                    setEditingPlaylist((prev) => ({
                      ...prev,
                      isPublic: e.target.checked,
                    }))
                  }
                />
              }
              label="Make playlist public"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditPlaylistOpen(false)}>
              <CancelIcon sx={{ mr: 1 }} />
              Cancel
            </Button>
            <Button onClick={handleUpdatePlaylist} variant="contained">
              <SaveIcon sx={{ mr: 1 }} />
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Playlist Confirmation Dialog */}
        <Dialog
          open={deletePlaylistOpen}
          onClose={() => setDeletePlaylistOpen(false)}
        >
          <DialogTitle>Delete Playlist</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone. All songs and collaborators will be
              removed.
            </Alert>
            <Typography>
              Are you sure you want to delete "{playlist?.name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeletePlaylistOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeletePlaylist}
              variant="contained"
              color="error"
            >
              Delete Playlist
            </Button>
          </DialogActions>
        </Dialog>

        {/* Collaborator Management Dialog */}
        <Dialog
          open={collaboratorManageOpen}
          onClose={() => setCollaboratorManageOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <People color="primary" />
              Manage Chain Validators
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddCollaboratorOpen(true)}
                sx={{ mb: 2 }}
              >
                Add New Validator
              </Button>
            </Box>

            {/* Current Collaborators List */}
            <Typography variant="h6" gutterBottom>
              Current Validators
            </Typography>
            <List>
              {/* Owner */}
              <ListItem
                sx={{ bgcolor: "rgba(255, 0, 0, 0.1)", borderRadius: 1, mb: 1 }}
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: "error.main" }}>
                    {playlist?.creator?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography fontWeight="bold">
                      {playlist?.creator?.username}
                    </Typography>
                  }
                  secondary="Genesis Block Creator"
                />
                <Chip label="owner" color="error" size="small" />
              </ListItem>

              {/* Collaborators */}
              {playlist?.collaborators?.map((collaborator, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <ListItemIcon>
                    <Avatar>
                      {collaborator.user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={collaborator.user?.username || "Unknown User"}
                    secondary={collaborator.user?.email || "No email"}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={collaborator.role}
                        label="Role"
                        onChange={(e) =>
                          handleUpdateCollaboratorRole(
                            collaborator.user._id,
                            e.target.value
                          )
                        }
                        disabled={collaboratorLoading}
                      >
                        <MenuItem value="viewer">Viewer</MenuItem>
                        <MenuItem value="contributor">Contributor</MenuItem>
                        <MenuItem value="editor">Editor</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleRemoveCollaborator(
                          collaborator.user._id,
                          collaborator.user?.username
                        )
                      }
                      disabled={collaboratorLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>

            {collaboratorLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCollaboratorManageOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Collaborator Dialog */}
        <Dialog
          open={addCollaboratorOpen}
          onClose={() => setAddCollaboratorOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonAddIcon color="primary" />
              Add New Validator
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Add a new validator to this blockchain playlist. They will receive
              permissions based on their assigned role.
            </Alert>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newCollaborator.email}
              onChange={(e) =>
                setNewCollaborator((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              margin="normal"
              error={!!collaboratorErrors.identifier}
              helperText={collaboratorErrors.identifier}
              InputProps={{
                startAdornment: (
                  <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ my: 1, textAlign: "center" }}
            >
              OR
            </Typography>

            <TextField
              fullWidth
              label="Username"
              value={newCollaborator.username}
              onChange={(e) =>
                setNewCollaborator((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              margin="normal"
              error={!!collaboratorErrors.identifier}
              InputProps={{
                startAdornment: (
                  <AccountCircleIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />

            <FormControl
              fullWidth
              margin="normal"
              error={!!collaboratorErrors.role}
            >
              <InputLabel>Role</InputLabel>
              <Select
                value={newCollaborator.role}
                label="Role"
                onChange={(e) =>
                  setNewCollaborator((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                <MenuItem value="viewer">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Viewer
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Can view playlist and songs
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="contributor">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Contributor
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Can add songs and vote
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="editor">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Editor
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Can edit songs and manage content
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Admin
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Full permissions except ownership
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
              {collaboratorErrors.role && (
                <Typography variant="caption" color="error">
                  {collaboratorErrors.role}
                </Typography>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAddCollaboratorOpen(false);
                setNewCollaborator({ email: "", username: "", role: "viewer" });
                setCollaboratorErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCollaborator}
              variant="contained"
              disabled={collaboratorLoading}
              startIcon={
                collaboratorLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <PersonAddIcon />
                )
              }
            >
              Add Validator
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default PlaylistPage;
