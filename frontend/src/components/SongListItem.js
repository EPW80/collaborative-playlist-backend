import React, { memo, useCallback, useMemo } from 'react';
import {
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Typography,
  Box,
  Fade
} from '@mui/material';
import { PlayArrow, MoreVertIcon } from '@mui/icons-material';

/**
 * Optimized song list item component with memoization
 */
export const SongListItem = memo(({
  song,
  index,
  darkMode,
  userPermissions,
  onSongPlay,
  onSongMenu,
  isCurrentSong,
  isPlaying
}) => {
  // Memoize click handlers to prevent recreating on each render
  const handlePlayClick = useCallback((e) => {
    e.stopPropagation();
    onSongPlay(song);
  }, [song, onSongPlay]);

  const handleMenuClick = useCallback((e) => {
    e.stopPropagation();
    onSongMenu(e, song);
  }, [song, onSongMenu]);

  // Memoize style calculations to prevent recalculation on every render
  const itemStyle = useMemo(() => ({
    borderRadius: 2,
    mb: 1,
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      transform: "translateX(8px)",
      bgcolor: darkMode
        ? "rgba(0, 230, 118, 0.1)"
        : "rgba(25, 118, 210, 0.1)",
    },
    ...(isCurrentSong && {
      bgcolor: darkMode
        ? "rgba(0, 230, 118, 0.2)"
        : "rgba(25, 118, 210, 0.2)",
    })
  }), [darkMode, isCurrentSong]);

  const avatarStyle = useMemo(() => ({
    mr: 2,
    background: darkMode
      ? "linear-gradient(135deg, #00e676, #00c853)"
      : "linear-gradient(135deg, #1976d2, #1565c0)",
    ...(isCurrentSong && isPlaying && {
      animation: 'pulse 2s infinite'
    })
  }), [darkMode, isCurrentSong, isPlaying]);

  // Memoize fade timeout calculation
  const fadeTimeout = useMemo(() => 300 + index * 50, [index]);

  return (
    <Fade
      in={true}
      timeout={fadeTimeout} // Use memoized timeout
      key={song._id || song.id || `song-${index}`}
    >
      <ListItem
        divider
        sx={itemStyle}
        data-song-id={song._id || song.id}
      >
        <Avatar sx={avatarStyle}>
          {index + 1}
        </Avatar>
        <ListItemText
          primary={
            <Typography fontWeight="bold" variant="body1">
              {song.title || `Track ${index + 1}`}
            </Typography>
          }
          secondary={
            <Typography variant="body2" color="text.secondary">
              {song.artist || "Unknown Artist"}
              {song.metadata?.aiRecommended && " • AI Recommended"}
            </Typography>
          }
        />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            color="primary"
            onClick={handlePlayClick}
            sx={{
              transition: "transform 0.2s ease-in-out",
              "&:hover": { transform: "scale(1.2)" },
            }}
            aria-label={`Play ${song.title}`}
          >
            <PlayArrow />
          </IconButton>
          {(userPermissions?.permissions?.canEdit ||
            userPermissions?.permissions?.canRemoveSongs) && (
            <IconButton
              color="error"
              onClick={handleMenuClick}
              sx={{
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.2)" },
              }}
              aria-label={`Options for ${song.title}`}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      </ListItem>
    </Fade>
  );
});

SongListItem.displayName = 'SongListItem';
