import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as SignalStrongIcon,
  SignalWifi3Bar as SignalGoodIcon,
  SignalWifi2Bar as SignalWeakIcon,
  SignalWifi1Bar as SignalPoorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

/**
 * Network Status Monitor Component
 * Displays real-time network connectivity and performance
 */
const NetworkStatusMonitor = memo(({ embedded = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    downlink: 0,
    rtt: 0,
    effectiveType: '4g'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update network information
  const updateNetworkInfo = useCallback(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      setNetworkStatus(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        effectiveType: connection.effectiveType || '4g'
      }));
    }
    
    setLastUpdate(new Date());
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update network info periodically
    const interval = setInterval(updateNetworkInfo, 30000);

    // Initial update
    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateNetworkInfo]);

  const getSignalIcon = () => {
    if (!networkStatus.isOnline) return <WifiOffIcon />;
    
    const downlink = networkStatus.downlink;
    if (downlink > 10) return <SignalStrongIcon />;
    if (downlink > 5) return <SignalGoodIcon />;
    if (downlink > 1) return <SignalWeakIcon />;
    return <SignalPoorIcon />;
  };

  const getSignalColor = () => {
    if (!networkStatus.isOnline) return 'error';
    
    const downlink = networkStatus.downlink;
    if (downlink > 10) return 'success';
    if (downlink > 5) return 'success';
    if (downlink > 1) return 'warning';
    return 'error';
  };

  const getConnectionQuality = () => {
    if (!networkStatus.isOnline) return 'Offline';
    
    const effectiveType = networkStatus.effectiveType;
    switch (effectiveType) {
      case 'slow-2g':
      case '2g': return 'Poor';
      case '3g': return 'Fair';
      case '4g': return 'Good';
      default: return 'Excellent';
    }
  };

  // Don't show if connection is good and mobile and not embedded
  if (networkStatus.isOnline && networkStatus.downlink > 5 && isMobile && !embedded) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        position: embedded ? 'absolute' : 'fixed',
        top: embedded ? 16 : (isMobile ? 16 : 24),
        right: embedded ? 16 : (isMobile ? 16 : 24),
        width: embedded 
          ? (isMobile ? 'calc(100% - 32px)' : 280)
          : (isMobile ? 'calc(100vw - 32px)' : 280),
        maxWidth: embedded 
          ? (isMobile ? 'none' : 280)
          : (isMobile ? 'none' : 280),
        zIndex: embedded ? 10 : 1200,
        background: theme.palette.mode === 'dark'
          ? 'rgba(26, 26, 26, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: embedded ? theme.shadows[2] : theme.shadows[4]
      }}
    >
      <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: showDetails ? 1 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getSignalIcon()}
            <Typography variant="caption" fontWeight={600}>
              Network
            </Typography>
            <Chip 
              label={getConnectionQuality()}
              size="small"
              color={getSignalColor()}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {!networkStatus.isOnline && (
          <Alert 
            severity="error" 
            sx={{ mb: 1, py: 0.5 }}
            icon={<WifiOffIcon />}
          >
            <Typography variant="caption">
              You're offline. Some features may be limited.
            </Typography>
          </Alert>
        )}

        <Collapse in={showDetails}>
          <Box sx={{ mt: 1 }}>
            {/* Connection Speed */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Speed
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {networkStatus.downlink > 0 ? `${networkStatus.downlink} Mbps` : 'Unknown'}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((networkStatus.downlink / 20) * 100, 100)}
                color={getSignalColor()}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            {/* Connection Details */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Type
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {networkStatus.effectiveType?.toUpperCase()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Latency
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {networkStatus.rtt > 0 ? `${networkStatus.rtt}ms` : 'Unknown'}
                </Typography>
              </Box>
            </Box>

            {/* Performance Tips */}
            {networkStatus.downlink < 2 && networkStatus.isOnline && (
              <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                <Typography variant="caption">
                  Slow connection detected. Consider enabling offline mode for better experience.
                </Typography>
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last checked: {lastUpdate.toLocaleTimeString()}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

NetworkStatusMonitor.displayName = 'NetworkStatusMonitor';

export default NetworkStatusMonitor;
