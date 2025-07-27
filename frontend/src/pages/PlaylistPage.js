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
  CircularProgress,
  Grid,
} from "@mui/material";
import { ArrowBack, People, Settings, PlayArrow } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { playlistAPI } from "../services/api";
import socketService from "../services/websocket";

function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const response = await playlistAPI.getById(id);
        const playlistData = response.data.data.playlist;
        setPlaylist(playlistData);
        setUserPermissions(playlistData.userAccess);

        // Join playlist room for real-time updates
        socketService.joinPlaylist(id);

        // Set up real-time listeners
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

    // Cleanup on unmount
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!playlist) {
    return (
      <Container>
        <Typography variant="h6">Playlist not found</Typography>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/dashboard")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {playlist.name}
          </Typography>
          <Chip
            label={userPermissions?.role || "viewer"}
            color={getRoleBadgeColor(userPermissions?.role)}
            size="small"
            sx={{ mr: 2 }}
          />
          {userPermissions?.permissions?.canManageSettings && (
            <IconButton color="inherit">
              <Settings />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Playlist Info */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                {playlist.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {playlist.description || "No description"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Chip
                  label={`${playlist.songs?.length || 0} songs`}
                  size="small"
                />
                <Chip
                  label={playlist.isPublic ? "Public" : "Private"}
                  size="small"
                />
                <Chip
                  label={`Created by ${playlist.creator?.username}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Paper>

            {/* Songs List */}
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5">Songs</Typography>
                {userPermissions?.permissions?.canEdit && (
                  <Button variant="contained" size="small">
                    Add Song
                  </Button>
                )}
              </Box>

              {playlist.songs?.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No songs in this playlist yet
                  </Typography>
                  {userPermissions?.permissions?.canEdit && (
                    <Button variant="outlined" sx={{ mt: 2 }}>
                      Add Your First Song
                    </Button>
                  )}
                </Box>
              ) : (
                <List>
                  {playlist.songs.map((song, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={song.title || `Song ${index + 1}`}
                        secondary={song.artist || "Unknown Artist"}
                      />
                      <IconButton>
                        <PlayArrow />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Collaborators */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <People sx={{ mr: 1 }} />
                <Typography variant="h6">Collaborators</Typography>
              </Box>

              <List dense>
                {/* Creator */}
                <ListItem>
                  <ListItemText
                    primary={playlist.creator?.username}
                    secondary="Owner"
                  />
                  <Chip label="owner" color="error" size="small" />
                </ListItem>

                {/* Collaborators */}
                {playlist.collaborators?.map((collaborator, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={collaborator.user?.username || "Unknown User"}
                      secondary={collaborator.role}
                    />
                    <Chip
                      label={collaborator.role}
                      color={getRoleBadgeColor(collaborator.role)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>

              {userPermissions?.permissions?.canManageCollaborators && (
                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  Manage Collaborators
                </Button>
              )}
            </Paper>

            {/* Permissions */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Permissions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {Object.entries(userPermissions?.permissions || {}).map(
                  ([permission, allowed]) => (
                    <Box
                      key={permission}
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">
                        {permission
                          .replace("can", "")
                          .replace(/([A-Z])/g, " $1")
                          .toLowerCase()}
                      </Typography>
                      <Chip
                        label={allowed ? "Yes" : "No"}
                        size="small"
                        color={allowed ? "success" : "default"}
                        variant={allowed ? "filled" : "outlined"}
                      />
                    </Box>
                  )
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default PlaylistPage;
