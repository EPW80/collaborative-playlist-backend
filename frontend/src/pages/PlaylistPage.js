import React, { useState, useEffect } from "react";
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
  Grid,
  Skeleton,
  Slider,
  Card,
  CardContent,
  Switch,
  Fade,
  Grow,
  Slide,
  Avatar,
  LinearProgress,
} from "@mui/material";
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
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { playlistAPI } from "../services/api";
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
      <Grid item xs={12} md={8}>
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
      <Grid item xs={12} md={4}>
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
const SongPlayer = ({ currentSong, isPlaying, onPlayPause, darkMode }) => {
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

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
          sx={{
            height: 2,
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
            <AccountTree />
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {currentSong?.title || "No song selected"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentSong?.artist || "Unknown Artist"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton color="primary">
              <SkipPrevious />
            </IconButton>
            <IconButton
              color="primary"
              onClick={onPlayPause}
              sx={{
                transform: "scale(1.2)",
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.3)" },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
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
              onChange={(_, value) => setVolume(value)}
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

  const handleSongAdded = (newSong) => {
    setPlaylist((prev) => ({
      ...prev,
      songs: [...(prev.songs || []), newSong],
    }));
  };

  const handleOpenMusicSearch = () => {
    setMusicSearchOpen(true);
  };

  const handleCloseMusicSearch = () => {
    setMusicSearchOpen(false);
  };

  const theme = createBlockchainTheme(darkMode);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const response = await playlistAPI.getById(id);
        const playlistData = response.data.data.playlist;
        setPlaylist(playlistData);
        setUserPermissions(playlistData.userAccess);

        if (playlistData.songs?.length > 0) {
          setCurrentSong(playlistData.songs[0]);
        }

        // Join playlist room for real-time updates
        socketService.joinPlaylist(id);

        // Set up real-time listeners with animations
        socketService.onPlaylistUpdate((updatedPlaylist) => {
          setPlaylist(updatedPlaylist);
        });

        socketService.onSongAdded((data) => {
          setPlaylist((prev) => ({
            ...prev,
            songs: [...prev.songs, data.song],
          }));
        });

        socketService.onCollaboratorAdded((data) => {
          setPlaylist((prev) => ({
            ...prev,
            collaborators: [...prev.collaborators, data.collaborator],
          }));
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
  }, [id]);

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

  const handleSongPlay = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
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
            <Grid item xs={12} md={8}>
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

                  {playlist.songs?.length === 0 ? (
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
                      {playlist.songs.map((song, index) => (
                        <Fade in={true} timeout={300 + index * 100} key={index}>
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
                          </ListItem>
                        </Fade>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* Enhanced Sidebar */}
            <Grid item xs={12} md={4}>
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
                    <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
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
          />
        )}

        {/* Music Search Modal */}
        <MusicSearch
          open={musicSearchOpen}
          onClose={handleCloseMusicSearch}
          playlistId={id}
          onSongAdded={handleSongAdded}
        />
      </Box>
    </ThemeProvider>
  );
}

export default PlaylistPage;
