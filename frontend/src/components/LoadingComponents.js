import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Backdrop,
  LinearProgress,
  Fade
} from '@mui/material';

/**
 * Enhanced loading spinner with different states
 */
export const LoadingSpinner = ({ 
  open = false, 
  message = "Loading...", 
  variant = "circular",
  size = 40,
  color = "primary",
  backdrop = false 
}) => {
  const progressComponent = variant === "linear" ? (
    <LinearProgress color={color} sx={{ width: '100%', mb: 2 }} />
  ) : (
    <CircularProgress size={size} color={color} />
  );

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={2}
    >
      {progressComponent}
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  if (backdrop) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={open}
      >
        <Fade in={open}>
          {content}
        </Fade>
      </Backdrop>
    );
  }

  return (
    <Fade in={open}>
      <Box>
        {content}
      </Box>
    </Fade>
  );
};

/**
 * Inline loading indicator for buttons and small components
 */
export const InlineLoader = ({ 
  loading = false, 
  size = 16, 
  color = "inherit",
  children 
}) => {
  if (!loading) {
    return children;
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <CircularProgress size={size} color={color} />
      {children}
    </Box>
  );
};

/**
 * Loading overlay for specific components
 */
export const LoadingOverlay = ({ 
  loading = false, 
  message = "Loading...",
  children 
}) => {
  return (
    <Box position="relative">
      {children}
      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.8)"
          zIndex={1}
          borderRadius={1}
        >
          <LoadingSpinner open={true} message={message} />
        </Box>
      )}
    </Box>
  );
};
