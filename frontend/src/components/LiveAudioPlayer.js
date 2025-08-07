import React, { memo, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Slider,
  LinearProgress,
  Chip,
  Collapse,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Equalizer as EqualizerIcon
} from '@mui/icons-material';

/**
 * Live Audio Player Component
 * Real-time audio playback with visualization
 */
const LiveAudioPlayer = memo(({ 
  playbackState, 
  currentSong, 
  onTogglePlayback,
  onStop,
  onSeek,
  onVolumeChange,
  onNext,
  onPrevious,
  playlist = [],
  currentIndex = -1,
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showDetails, setShowDetails] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = playbackState.duration > 0 
    ? (playbackState.currentTime / playbackState.duration) * 100 
    : 0;

  // Handle volume mute/unmute
  const handleVolumeToggle = () => {
    if (playbackState.volume > 0) {
      setPreviousVolume(playbackState.volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(previousVolume);
    }
  };

  // Real-time waveform simulation
  const [waveformData, setWaveformData] = useState(new Array(50).fill(0));
  
  useEffect(() => {
    if (!playbackState.isPlaying) return;

    const interval = setInterval(() => {
      setWaveformData(prev => {
        const newData = [...prev];
        // Simulate audio waveform
        for (let i = 0; i < newData.length; i++) {
          newData[i] = Math.random() * 0.8 + 0.2;
        }
        return newData;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [playbackState.isPlaying]);

  if (!currentSong) return null;

  return (
    <Card
      className={className}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
          : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
        borderRadius: 0,
        borderTop: `2px solid ${theme.palette.primary.main}`,
        backdropFilter: 'blur(10px)',
        boxShadow: theme.shadows[8]
      }}
    >
      {/* Buffer Progress */}
      {playbackState.isLoading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            height: 2,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main
            }
          }} 
        />
      )}

      <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
        {/* Main Controls Row */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: showDetails ? 1 : 0
        }}>
          {/* Song Info */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            flex: 1, 
            minWidth: 0 
          }}>
            <Avatar
              sx={{
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                background: 'linear-gradient(45deg, #1976d2, #00e676)'
              }}
            >
              <EqualizerIcon />
            </Avatar>
            
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant={isMobile ? "body2" : "subtitle1"} 
                noWrap
                sx={{ fontWeight: 600 }}
              >
                {currentSong.title}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                noWrap
              >
                {currentSong.artist}
              </Typography>
            </Box>

            {playbackState.error && (
              <Chip 
                label={
                  playbackState.error === 'No preview available' 
                    ? "No Preview" 
                    : "Error"
                } 
                size="small" 
                color={
                  playbackState.error === 'No preview available' 
                    ? "default" 
                    : "error"
                }
                variant={
                  playbackState.error === 'No preview available' 
                    ? "outlined" 
                    : "filled"
                }
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {/* Playback Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              onClick={onPrevious}
              disabled={currentIndex <= 0}
              size={isMobile ? "small" : "medium"}
            >
              <PrevIcon />
            </IconButton>
            
            <IconButton 
              onClick={onTogglePlayback}
              disabled={
                playbackState.isLoading || 
                playbackState.error === 'No preview available'
              }
              size={isMobile ? "medium" : "large"}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabled,
                  color: theme.palette.action.disabled,
                }
              }}
            >
              {playbackState.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            
            <IconButton 
              onClick={onNext}
              disabled={currentIndex >= playlist.length - 1}
              size={isMobile ? "small" : "medium"}
            >
              <NextIcon />
            </IconButton>
            
            <IconButton 
              onClick={onStop}
              size={isMobile ? "small" : "medium"}
            >
              <StopIcon />
            </IconButton>
          </Box>

          {/* Volume and Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && (
              <>
                <IconButton 
                  onClick={handleVolumeToggle}
                  size="small"
                >
                  {playbackState.volume > 0 ? <VolumeIcon /> : <MuteIcon />}
                </IconButton>
                
                <Slider
                  value={playbackState.volume}
                  onChange={(_, value) => onVolumeChange(value)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ width: 80 }}
                  size="small"
                />
              </>
            )}
            
            <IconButton 
              onClick={() => setShowDetails(!showDetails)}
              size="small"
            >
              {showDetails ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showDetails ? 1 : 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            {formatTime(playbackState.currentTime)}
          </Typography>
          
          <Slider
            value={progress}
            onChange={(_, value) => {
              const newTime = (value / 100) * playbackState.duration;
              onSeek(newTime);
            }}
            sx={{ 
              flex: 1,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
              '& .MuiSlider-track': {
                height: 4,
              },
              '& .MuiSlider-rail': {
                height: 4,
                opacity: 0.3,
              }
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            {formatTime(playbackState.duration)}
          </Typography>
        </Box>

        {/* Expanded Details */}
        <Collapse in={showDetails}>
          <Box sx={{ pt: 1 }}>
            {/* Waveform Visualization */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Live Waveform
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'end', 
                gap: 0.5, 
                height: 40,
                justifyContent: 'center'
              }}>
                {waveformData.map((height, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 3,
                      height: `${height * 100}%`,
                      backgroundColor: playbackState.isPlaying 
                        ? theme.palette.primary.main 
                        : theme.palette.grey[400],
                      borderRadius: 1,
                      transition: 'height 0.1s ease-in-out, background-color 0.2s'
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Playback Stats */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: 1,
              mb: 1 
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Buffer
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round(playbackState.buffered * 100)}%
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Volume
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round(playbackState.volume * 100)}%
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Position
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {currentIndex + 1} / {playlist.length}
                </Typography>
              </Box>
            </Box>

            {/* Mobile Volume Control */}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={handleVolumeToggle}
                  size="small"
                >
                  {playbackState.volume > 0 ? <VolumeIcon /> : <MuteIcon />}
                </IconButton>
                
                <Slider
                  value={playbackState.volume}
                  onChange={(_, value) => onVolumeChange(value)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ flex: 1 }}
                  size="small"
                />
                
                <Typography variant="caption" color="text.secondary">
                  {Math.round(playbackState.volume * 100)}%
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

LiveAudioPlayer.displayName = 'LiveAudioPlayer';

export default LiveAudioPlayer;
