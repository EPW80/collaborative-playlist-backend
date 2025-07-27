import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistAPI } from '../services/api';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  // Load playlists
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const response = await playlistAPI.getAll();
        setPlaylists(response.data.data.playlists || []);
      } catch (error) {
        console.error('Error loading playlists:', error);
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
    // Navigate to create playlist or open modal
    console.log('Create playlist functionality coming soon!');
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  return (
    <>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Collaborative Playlist Manager
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              Welcome, {user?.username}!
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account menu"
              aria-controls="account-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <Logout fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Playlists
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePlaylist}
          >
            Create Playlist
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading playlists...</Typography>
        ) : playlists.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No playlists yet
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Create your first collaborative playlist to get started!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePlaylist}
            >
              Create Your First Playlist
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {playlists.map((playlist) => (
              <Grid item xs={12} sm={6} md={4} key={playlist._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {playlist.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {playlist.description || 'No description'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {playlist.songs?.length || 0} songs
                    </Typography>
                    <Typography variant="caption" display="block">
                      {playlist.collaborators?.length || 0} collaborators
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Created by: {playlist.creator?.username}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handlePlaylistClick(playlist._id)}
                    >
                      Open
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}

export default DashboardPage;
