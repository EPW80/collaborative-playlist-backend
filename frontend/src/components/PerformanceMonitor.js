import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Speed, ExpandMore, ExpandLess } from '@mui/icons-material';

/**
 * Development-only performance monitor
 */
export const PerformanceMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    slowOperations: [],
    memoryUsage: 0,
    lastUpdate: Date.now()
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const slowOperations = [];

    // Monitor performance observer if available
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 16) { // Longer than one frame
            slowOperations.push({
              name: entry.name,
              duration: entry.duration.toFixed(2),
              timestamp: Date.now()
            });
          }
        });
        
        // Keep only last 10 slow operations
        if (slowOperations.length > 10) {
          slowOperations.splice(0, slowOperations.length - 10);
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });

      // Memory usage monitoring
      const interval = setInterval(() => {
        if (window.performance && window.performance.memory) {
          setMetrics(prev => ({
            ...prev,
            renderCount: prev.renderCount + 1,
            slowOperations: [...slowOperations],
            memoryUsage: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
            lastUpdate: Date.now()
          }));
        }
      }, 2000);

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }

    // Fallback memory monitoring if PerformanceObserver is not available
    const interval = setInterval(() => {
      if (window.performance && window.performance.memory) {
        setMetrics(prev => ({
          ...prev,
          renderCount: prev.renderCount + 1,
          slowOperations: [...slowOperations],
          memoryUsage: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
          lastUpdate: Date.now()
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        minWidth: 200
      }}
    >
      <Paper elevation={4} sx={{ p: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Speed sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ flexGrow: 1 }}>
            Performance Monitor
          </Typography>
          <IconButton size="small">
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={isOpen}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" display="block">
              Memory: {metrics.memoryUsage} MB
            </Typography>
            <Typography variant="caption" display="block">
              Renders: {metrics.renderCount}
            </Typography>
            
            {metrics.slowOperations.length > 0 && (
              <>
                <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
                  Slow Operations:
                </Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {metrics.slowOperations.slice(-5).map((op, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption">
                              {op.name || 'Unknown'}
                            </Typography>
                            <Chip
                              label={`${op.duration}ms`}
                              size="small"
                              color={op.duration > 50 ? 'error' : 'warning'}
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};
