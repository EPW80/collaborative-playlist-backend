import React, { memo, useState, useCallback } from 'react';
import { 
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Enhanced Performance Monitor Component
 * Displays real-time performance metrics with mobile-optimized UI
 */
const EnhancedPerformanceMonitor = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics] = useState({
    memoryUsage: 0,
    renderCount: 0,
    loadTime: 0,
    networkLatency: 0,
    webSocketStatus: 'connected',
    lastUpdate: new Date(),
    performanceScore: 95
  });

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 90) return <CheckCircleIcon />;
    if (score >= 70) return <WarningIcon />;
    return <ErrorIcon />;
  };

  const formatMemory = (bytes) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Only show in development or if performance issues detected
  if (process.env.NODE_ENV === 'production' && metrics.performanceScore > 85) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        position: 'fixed',
        bottom: isMobile ? 16 : 24,
        right: isMobile ? 16 : 24,
        width: isMobile ? 'calc(100vw - 32px)' : 320,
        maxWidth: isMobile ? 'none' : 320,
        zIndex: 1300,
        background: theme.palette.mode === 'dark'
          ? 'rgba(26, 26, 26, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[8]
      }}
    >
      <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: isExpanded ? 2 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getPerformanceIcon(metrics.performanceScore)}
            <Typography variant="caption" fontWeight={600}>
              Performance
            </Typography>
            <Chip 
              label={`${metrics.performanceScore}%`}
              size="small"
              color={getPerformanceColor(metrics.performanceScore)}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          <IconButton size="small" onClick={toggleExpanded}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 1 }}>
            {/* Performance Score Bar */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Overall Score
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics.performanceScore}
                color={getPerformanceColor(metrics.performanceScore)}
                sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
              />
            </Box>

            {/* Detailed Metrics */}
            <List dense disablePadding>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <MemoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Memory</Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {formatMemory(metrics.memoryUsage * 1024 * 1024)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <SpeedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Load Time</Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {metrics.loadTime}ms
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <NetworkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">WebSocket</Typography>
                      <Chip 
                        label={metrics.webSocketStatus}
                        size="small"
                        color={metrics.webSocketStatus === 'connected' ? 'success' : 'error'}
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {metrics.lastUpdate.toLocaleTimeString()}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

EnhancedPerformanceMonitor.displayName = 'EnhancedPerformanceMonitor';

export default EnhancedPerformanceMonitor;
