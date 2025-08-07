import React, { memo } from 'react';
import { 
  Box, 
  useMediaQuery, 
  useTheme,
  Drawer,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Responsive navigation drawer for mobile devices
 */
const MobileNavigation = memo(({ open, onClose, user }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      description: 'Your playlists overview'
    },
    { 
      text: 'Discover', 
      icon: <SearchIcon />, 
      path: '/discover',
      description: 'Find new music'
    },
    { 
      text: 'AI Features', 
      icon: <AIIcon />, 
      path: '/ai-features',
      description: 'Smart recommendations'
    },
    { 
      text: 'Collaborators', 
      icon: <PeopleIcon />, 
      path: '/collaborators',
      description: 'Manage team'
    },
    { 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings',
      description: 'Account preferences'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  if (!isMobile) return null;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
            : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(0, 230, 118, 0.3)'
            : '1px solid rgba(25, 118, 210, 0.3)',
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6" sx={{ 
            background: 'linear-gradient(45deg, #1976d2, #00e676)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            BlockBeats
          </Typography>
          <IconButton onClick={onClose} color="primary">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Welcome back, {user?.username}!
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <List>
          {navigationItems.map((item) => (
            <ListItem
              key={item.text}
              button
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&.Mui-selected': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(0, 230, 118, 0.1)'
                    : 'rgba(25, 118, 210, 0.1)',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }
                },
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                  transform: 'translateX(4px)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                secondary={item.description}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
});

MobileNavigation.displayName = 'MobileNavigation';

export default MobileNavigation;
