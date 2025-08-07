import React, { memo } from 'react';
import { 
  Box,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  Divider,
  Link,
  IconButton
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import NetworkStatusMonitor from './NetworkStatusMonitor';

/**
 * Application Footer Component
 * Contains network status monitor and app information
 */
const Footer = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        mt: 'auto',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
          : 'linear-gradient(135deg, #f8f9fa, #ffffff)',
        borderTop: `1px solid ${theme.palette.divider}`,
        py: 3,
        px: 2
      }}
    >
      {/* Network Status Monitor positioned in footer */}
      <NetworkStatusMonitor embedded={true} />
      
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: 3,
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          {/* Left section - App Info */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(45deg, #1976d2, #00e676)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                mb: 1
              }}
            >
              BlockBeats
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Collaborative Playlist Management Platform
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-time collaboration • AI-powered recommendations • Multi-service integration
            </Typography>
          </Box>

          {/* Center section - Quick Links */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Features
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link
                href="#"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Real-time Collaboration
              </Link>
              <Link
                href="#"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                AI Music Discovery
              </Link>
              <Link
                href="#"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Multi-platform Search
              </Link>
              <Link
                href="#"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Blockchain Integration
              </Link>
            </Box>
          </Box>

          {/* Right section - Social Links */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Connect
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <IconButton
                size="small"
                href="https://github.com/EPW80"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                href="https://www.linkedin.com/in/erikparrawilliams/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                href="mailto:erikpw009@gmail.com"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <EmailIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Built with React & Material-UI
            </Typography>
          </Box>
        </Box>

        {/* Bottom section - Copyright */}
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © 2025 BlockBeats. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="#"
              variant="caption"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              variant="caption"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              variant="caption"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Support
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
});

Footer.displayName = 'Footer';

export default Footer;
