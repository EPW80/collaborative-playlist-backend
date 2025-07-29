import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  Fade,
  Grow,
  Chip,
  Skeleton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  AccountCircle,
  Logout,
  Security,
  AccountTree,
  Speed,
  Brightness4,
  Brightness7,
  QueueMusic,
  People,
  Lock,
  Public,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { playlistAPI } from "../services/api";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Create blockchain-inspired theme
const createBlockchainTheme = (darkMode) =>
  createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#00e676" : "#1976d2",
        dark: darkMode ? "#00c853" : "#1565c0",
        light: darkMode ? "#66ffa6" : "#42a5f5",
      },
      secondary: {
        main: darkMode ? "#1976d2" : "#00e676",
        dark: darkMode ? "#1565c0" : "#00c853",
        light: darkMode ? "#42a5f5" : "#66ffa6",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#333333",
        secondary: darkMode ? "#b0b0b0" : "#666666",
      },
    },
    typography: {
      h4: {
        fontWeight: 700,
        background: darkMode
          ? "linear-gradient(45deg, #00e676, #1976d2)"
          : "linear-gradient(45deg, #1976d2, #00e676)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 600,
            background: darkMode
              ? "linear-gradient(45deg, #00e676, #1976d2)"
              : "linear-gradient(45deg, #1976d2, #00e676)",
            color: "white",
            "&:hover": {
              background: darkMode
                ? "linear-gradient(45deg, #00c853, #1565c0)"
                : "linear-gradient(45deg, #1565c0, #00c853)",
              transform: "scale(1.02)",
            },
            transition: "all 0.3s ease",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: "all 0.3s ease",
            background: darkMode
              ? "linear-gradient(135deg, #1e1e1e, #2a2a2a)"
              : "linear-gradient(135deg, #ffffff, #f8f9fa)",
            border: darkMode
              ? "1px solid rgba(0, 230, 118, 0.3)"
              : "1px solid rgba(25, 118, 210, 0.3)",
            "&:hover": {
              transform: "translateY(-8px)",
              boxShadow: darkMode
                ? "0 12px 24px rgba(0, 230, 118, 0.3)"
                : "0 12px 24px rgba(25, 118, 210, 0.3)",
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode
              ? "linear-gradient(135deg, #121212, #1e1e1e)"
              : "linear-gradient(135deg, #1976d2, #00e676)",
            borderBottom: darkMode
              ? "1px solid rgba(0, 230, 118, 0.3)"
              : "1px solid rgba(255, 255, 255, 0.2)",
          },
        },
      },
    },
  });

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Create playlist modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const theme = createBlockchainTheme(darkMode);

  // Load playlists
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const response = await playlistAPI.getAll();
        setPlaylists(response.data.data.playlists || []);
      } catch (error) {
        console.error("Error loading playlists:", error);
        setSnackbar({
          open: true,
          message: "Failed to load playlists",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleCreatePlaylist = () => {
    setCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setFormData({
      name: "",
      description: "",
      isPublic: true,
    });
    setFormErrors({});
  };

  const handleFormChange = (field) => (event) => {
    const value =
      field === "isPublic" ? event.target.value === "true" : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Playlist name is required";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Playlist name must be at least 3 characters";
    } else if (formData.name.trim().length > 50) {
      errors.name = "Playlist name must be less than 50 characters";
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = "Description must be less than 200 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPlaylist = async () => {
    if (!validateForm()) {
      return;
    }

    setCreateLoading(true);
    try {
      const playlistData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPublic: formData.isPublic,
      };

      const response = await playlistAPI.create(playlistData);
      const newPlaylist = response.data.data.playlist;

      // Add the new playlist to the list
      setPlaylists((prev) => [newPlaylist, ...prev]);

      // Show success message
      setSnackbar({
        open: true,
        message: "Playlist created successfully!",
        severity: "success",
      });

      // Close modal and reset form
      handleCloseModal();

      // Optionally navigate to the new playlist
      // navigate(`/playlist/${newPlaylist._id}`);
    } catch (error) {
      console.error("Error creating playlist:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to create playlist",
        severity: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #121212 0%, #1e1e1e 50%, #2a2a2a 100%)"
              : "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #ffffff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: 80,
            height: 80,
            background: "linear-gradient(45deg, #00e676, #1976d2)",
            borderRadius: "50%",
            opacity: 0.1,
            animation: "float 6s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-20px)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            right: "10%",
            width: 60,
            height: 60,
            background: "linear-gradient(45deg, #1976d2, #00e676)",
            borderRadius: "20%",
            opacity: 0.1,
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "20%",
            left: "10%",
            width: 100,
            height: 40,
            background: "linear-gradient(45deg, #00e676, #1976d2)",
            borderRadius: "10px",
            opacity: 0.1,
            animation: "float 10s ease-in-out infinite",
          }}
        />

        {/* App Bar */}
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              <Security sx={{ mr: 1, color: "#00e676" }} />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(45deg, #00e676, #ffffff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                BlockBeats
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ flexGrow: 1, opacity: 0.8 }}>
              Decentralized Music Collaboration
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    icon={<Brightness7 />}
                    checkedIcon={<Brightness4 />}
                  />
                }
                label=""
              />
              <Chip
                icon={<AccountTree />}
                label={`Chain User: ${user?.username}`}
                variant="outlined"
                sx={{
                  color: "#00e676",
                  borderColor: "#00e676",
                  "& .MuiChip-icon": { color: "#00e676" },
                }}
              />
              <IconButton
                size="large"
                edge="end"
                aria-label="account menu"
                aria-controls="account-menu"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                sx={{
                  color: "#00e676",
                  "&:hover": {
                    background: "rgba(0, 230, 118, 0.1)",
                  },
                }}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, #1e1e1e, #2a2a2a)"
                        : "linear-gradient(135deg, #ffffff, #f8f9fa)",
                    border: `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(0, 230, 118, 0.3)"
                        : "rgba(25, 118, 210, 0.3)"
                    }`,
                  },
                }}
              >
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1, color: "#f44336" }} />
                  Disconnect Wallet
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Fade in timeout={1000}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
                p: 3,
                borderRadius: 3,
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(30, 30, 30, 0.7)"
                    : "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(0, 230, 118, 0.3)"
                    : "rgba(25, 118, 210, 0.3)"
                }`,
              }}
            >
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Music Chain Vault
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your decentralized playlist collection
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreatePlaylist}
                sx={{
                  px: 3,
                  py: 1.5,
                  background: "linear-gradient(45deg, #00e676, #1976d2)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #00c853, #1565c0)",
                    transform: "scale(1.05)",
                  },
                }}
              >
                Mint Playlist
              </Button>
            </Box>
          </Fade>

          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="80%" height={32} />
                      <Skeleton variant="text" width="100%" height={20} />
                      <Skeleton variant="text" width="60%" height={20} />
                      <Box sx={{ mt: 2 }}>
                        <Skeleton variant="text" width="40%" height={16} />
                        <Skeleton variant="text" width="50%" height={16} />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Skeleton variant="rectangular" width={80} height={32} />
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : playlists.length === 0 ? (
            <Fade in timeout={1500}>
              <Paper
                sx={{
                  p: 6,
                  textAlign: "center",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #1e1e1e, #2a2a2a)"
                      : "linear-gradient(135deg, #ffffff, #f8f9fa)",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(0, 230, 118, 0.3)"
                      : "rgba(25, 118, 210, 0.3)"
                  }`,
                  borderRadius: 3,
                }}
              >
                <QueueMusic
                  sx={{
                    fontSize: 64,
                    color: theme.palette.primary.main,
                    mb: 2,
                  }}
                />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  No Playlists in Chain
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Start your decentralized music journey by creating your first
                  collaborative playlist!
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleCreatePlaylist}
                  sx={{
                    mt: 2,
                    px: 4,
                    py: 1.5,
                    background: "linear-gradient(45deg, #00e676, #1976d2)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #00c853, #1565c0)",
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  Mint Your First Playlist
                </Button>
              </Paper>
            </Fade>
          ) : (
            <Grid container spacing={3}>
              {playlists.map((playlist, index) => (
                <Grid item xs={12} sm={6} md={4} key={playlist._id}>
                  <Grow in timeout={1000 + index * 200}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Avatar
                            sx={{
                              background:
                                "linear-gradient(45deg, #00e676, #1976d2)",
                              mr: 2,
                              width: 48,
                              height: 48,
                            }}
                          >
                            <QueueMusic />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              component="div"
                              gutterBottom
                            >
                              {playlist.name}
                            </Typography>
                            <Chip
                              icon={playlist.isPublic ? <Public /> : <Lock />}
                              label={
                                playlist.isPublic
                                  ? "Public Chain"
                                  : "Private Chain"
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                color: playlist.isPublic
                                  ? "#00e676"
                                  : "#ff9800",
                                borderColor: playlist.isPublic
                                  ? "#00e676"
                                  : "#ff9800",
                                "& .MuiChip-icon": {
                                  color: playlist.isPublic
                                    ? "#00e676"
                                    : "#ff9800",
                                },
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          paragraph
                          sx={{ minHeight: 40 }}
                        >
                          {playlist.description || "No description available"}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            mb: 2,
                          }}
                        >
                          <Chip
                            icon={<QueueMusic />}
                            label={`${playlist.songs?.length || 0} tracks`}
                            size="small"
                            variant="filled"
                            sx={{
                              background: "rgba(25, 118, 210, 0.1)",
                              color: "#1976d2",
                            }}
                          />
                          <Chip
                            icon={<People />}
                            label={`${
                              playlist.collaborators?.length || 0
                            } collaborators`}
                            size="small"
                            variant="filled"
                            sx={{
                              background: "rgba(0, 230, 118, 0.1)",
                              color: "#00e676",
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Chain Creator:{" "}
                          {playlist.creator?.username || "Unknown"}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          size="medium"
                          onClick={() => handlePlaylistClick(playlist._id)}
                          startIcon={<Speed />}
                          sx={{
                            background:
                              "linear-gradient(45deg, #1976d2, #00e676)",
                            color: "white",
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #1565c0, #00c853)",
                              transform: "scale(1.05)",
                            },
                          }}
                        >
                          Access Chain
                        </Button>
                      </CardActions>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>

        {/* Create Playlist Modal */}
        <Dialog
          open={createModalOpen}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #1e1e1e, #2a2a2a)"
                  : "linear-gradient(135deg, #ffffff, #f8f9fa)",
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(0, 230, 118, 0.3)"
                  : "rgba(25, 118, 210, 0.3)"
              }`,
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #1976d2, #00e676)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700,
              fontSize: "1.5rem",
            }}
          >
            🎵 Mint New Playlist
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box
              component="form"
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <TextField
                label="Playlist Name"
                value={formData.name}
                onChange={handleFormChange("name")}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                required
                placeholder="Enter your playlist name..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.primary.main,
                  },
                }}
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={handleFormChange("description")}
                error={!!formErrors.description}
                helperText={
                  formErrors.description ||
                  `${formData.description.length}/200 characters`
                }
                fullWidth
                multiline
                rows={3}
                placeholder="Describe your playlist..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.primary.main,
                  },
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={formData.isPublic.toString()}
                  onChange={handleFormChange("isPublic")}
                  label="Visibility"
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.23)"
                          : "rgba(0, 0, 0, 0.23)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="true">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Public sx={{ color: "#00e676" }} />
                      Public Chain - Anyone can discover
                    </Box>
                  </MenuItem>
                  <MenuItem value="false">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Lock sx={{ color: "#ff9800" }} />
                      Private Chain - Invite only
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background:
                    theme.palette.mode === "dark"
                      ? "rgba(0, 230, 118, 0.1)"
                      : "rgba(25, 118, 210, 0.1)",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(0, 230, 118, 0.3)"
                      : "rgba(25, 118, 210, 0.3)"
                  }`,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  🔗 Blockchain Features:
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  • Decentralized collaboration with role-based permissions
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  • Real-time synchronization across all connected nodes
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  • Immutable playlist history and version tracking
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={handleCloseModal}
              disabled={createLoading}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  background:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPlaylist}
              disabled={createLoading || !formData.name.trim()}
              variant="contained"
              startIcon={
                createLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddIcon />
                )
              }
              sx={{
                background: "linear-gradient(45deg, #00e676, #1976d2)",
                "&:hover": {
                  background: "linear-gradient(45deg, #00c853, #1565c0)",
                },
                "&:disabled": {
                  background: "rgba(0, 0, 0, 0.12)",
                  color: "rgba(0, 0, 0, 0.26)",
                },
              }}
            >
              {createLoading ? "Minting..." : "Mint Playlist"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #1e1e1e, #2a2a2a)"
                  : "linear-gradient(135deg, #ffffff, #f8f9fa)",
              color: theme.palette.text.primary,
              border: `1px solid ${
                snackbar.severity === "success"
                  ? "#00e676"
                  : snackbar.severity === "error"
                  ? "#f44336"
                  : "#ff9800"
              }`,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default DashboardPage;
