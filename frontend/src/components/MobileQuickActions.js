import React, { memo, useState, useCallback, useMemo } from 'react';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  QueueMusic as PlaylistIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  SmartToy as AIIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Mobile-optimized Quick Actions component
 * Provides easy access to common actions on mobile devices
 */
const MobileQuickActions = memo(({ user, onCreatePlaylist, notifications = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const quickActions = useMemo(() => [
    {
      label: 'Create Playlist',
      icon: <AddIcon />,
      color: 'primary',
      action: () => {
        onCreatePlaylist();
        setDrawerOpen(false);
      }
    },
    {
      label: 'Search Music',
      icon: <SearchIcon />,
      color: 'secondary',
      action: () => {
        navigate('/search');
        setDrawerOpen(false);
      }
    },
    {
      label: 'AI Features',
      icon: <AIIcon />,
      color: 'success',
      action: () => {
        navigate('/ai-features');
        setDrawerOpen(false);
      }
    },
    {
      label: 'Trending',
      icon: <TrendingIcon />,
      color: 'warning',
      action: () => {
        navigate('/trending');
        setDrawerOpen(false);
      }
    }
  ], [navigate, onCreatePlaylist]);

  if (!isMobile) return null;

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300,
          background: 'linear-gradient(45deg, #1976d2, #00e676)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1565c0, #00c853)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease-in-out'
        }}
        onClick={toggleDrawer}
      >
        <AddIcon />
      </Fab>

      {/* Quick Actions Drawer */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
              : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
            maxHeight: '50vh'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(45deg, #1976d2, #00e676)',
                  fontSize: '0.875rem'
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Quick Actions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.username}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={notifications.length} color="error">
                <IconButton size="small" color="primary">
                  <NotificationsIcon />
                </IconButton>
              </Badge>
              <IconButton onClick={toggleDrawer} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Quick Action Grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 2,
            mb: 2 
          }}>
            {quickActions.map((action, index) => (
              <Card
                key={action.label}
                onClick={action.action}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  '&:last-child': { pb: 2 } 
                }}>
                  <IconButton
                    color={action.color}
                    sx={{ 
                      mb: 1, 
                      background: `${theme.palette[action.color].main}15`,
                      '&:hover': {
                        background: `${theme.palette[action.color].main}25`,
                      }
                    }}
                  >
                    {action.icon}
                  </IconButton>
                  <Typography variant="caption" display="block" fontWeight={500}>
                    {action.label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Recent Activity */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recent Activity
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PlaylistIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="My Chill Vibes"
                  secondary="2 songs added"
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Chip label="2h ago" size="small" variant="outlined" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PeopleIcon fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText 
                  primary="New Collaborator"
                  secondary="Alex joined Rock Classics"
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Chip label="5h ago" size="small" variant="outlined" />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>
    </>
  );
});

MobileQuickActions.displayName = 'MobileQuickActions';

export default MobileQuickActions;
