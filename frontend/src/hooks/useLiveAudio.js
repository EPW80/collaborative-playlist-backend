import { useState, useEffect, useRef, useCallback } from 'react';
import { liveAudioManager } from '../utils/liveAudioManager';

/**
 * Custom hook for live audio playback with real-time updates
 */
export const useLiveAudio = () => {
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    buffered: 0,
    error: null
  });

  const [currentSong, setCurrentSong] = useState(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      audioRef.current = audio;
      console.log('🎵 Audio element created');
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Handle live audio manager events
  const handleAudioEvent = useCallback((eventType, data) => {
    switch (eventType) {
      case 'loadstart':
        setPlaybackState(prev => ({ ...prev, isLoading: true, error: null }));
        break;
      
      case 'canplay':
        setPlaybackState(prev => ({ ...prev, isLoading: false }));
        break;
      
      case 'play':
        setPlaybackState(prev => ({ ...prev, isPlaying: true }));
        break;
      
      case 'pause':
      case 'stop':
        setPlaybackState(prev => ({ ...prev, isPlaying: false }));
        break;
      
      case 'timeupdate':
        setPlaybackState(prev => ({ 
          ...prev, 
          currentTime: data.currentTime || 0 
        }));
        break;
      
      case 'progress':
        setPlaybackState(prev => ({ 
          ...prev, 
          buffered: data.buffered || 0 
        }));
        break;
      
      case 'volumechange':
        setPlaybackState(prev => ({ 
          ...prev, 
          volume: data.volume || 1 
        }));
        break;
      
      case 'error':
        setPlaybackState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isPlaying: false,
          error: data.message || 'Audio error occurred'
        }));
        break;
      
      case 'bufferlow':
        console.warn('⚠️ Audio buffer running low:', data.bufferAhead);
        break;
      
      default:
        break;
    }
  }, []);

  // Initialize audio manager and event listener
  useEffect(() => {
    liveAudioManager.addEventListener(handleAudioEvent);
    
    return () => {
      liveAudioManager.removeEventListener(handleAudioEvent);
    };
  }, [handleAudioEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Load and play a song
   */
  const playSong = useCallback(async (song) => {
    console.log('🎵 playSong called with:', song.title, 'by', song.artist);
    console.log('🎵 audioRef.current:', audioRef.current);
    
    if (!audioRef.current || !song) {
      console.error('❌ No audio element or song:', { audioRef: audioRef.current, song });
      return { success: false, error: 'No audio element or song' };
    }

    try {
      // Cancel any existing operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Stop current playback
      liveAudioManager.stop(audioRef.current);
      
      // Clear any previous state
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        currentTime: 0,
        error: null
      }));
      
      // Set current song
      setCurrentSong(song);
      
      // Determine audio URL
      let audioUrl = null;
      let audioType = "unknown";

      if (song.metadata?.previewUrl) {
        audioUrl = song.metadata.previewUrl;
        audioType = "preview";
      } else {
        // No audio available - just update UI state without actual playback
        audioType = song.spotifyId ? "no_preview_spotify" : "no_preview_other";
        console.log(`🎵 No audio preview available for: ${song.title} by ${song.artist}`);
        
        // Set the actual song duration from metadata or a reasonable default
        const actualDuration = song.duration_ms ? Math.floor(song.duration_ms / 1000) : 
                              song.duration ? song.duration : 
                              180; // 3 minutes default
        
        setPlaybackState(prev => ({
          ...prev,
          duration: actualDuration,
          isPlaying: false, // Don't actually play since there's no audio
          isLoading: false,
          error: 'No preview available'
        }));
        
        console.log(`🎵 Set duration to ${actualDuration}s for ${song.title}`);
        return { success: true, audioType, simulatedOnly: true };
      }

      if (!audioUrl) {
        throw new Error('No audio URL available');
      }

      console.log(`🎵 Loading ${audioType} audio:`, audioUrl);
      console.log('🔊 Audio element volume before play:', audioRef.current.volume);
      console.log('🔊 Audio element muted:', audioRef.current.muted);
      console.log('🔊 Audio element paused state:', audioRef.current.paused);
      console.log('🔊 Audio element readyState:', audioRef.current.readyState);

      // Ensure audio element is not muted and has volume
      audioRef.current.muted = false;
      audioRef.current.volume = Math.max(audioRef.current.volume, 0.5);

      // Load and play audio
      await liveAudioManager.loadAudio(
        audioRef.current, 
        audioUrl, 
        abortControllerRef.current
      );

      if (!abortControllerRef.current.signal.aborted) {
        await liveAudioManager.playAudio(audioRef.current);
        
        console.log('🔊 Audio element volume after play:', audioRef.current.volume);
        console.log('🔊 Audio element muted after play:', audioRef.current.muted);
        console.log('🔊 Audio element paused state after play:', audioRef.current.paused);
        console.log('🔊 Audio element currentTime after play:', audioRef.current.currentTime);
        console.log('🔊 Audio element duration:', audioRef.current.duration);
        
        // Update duration after loading
        setPlaybackState(prev => ({
          ...prev,
          duration: audioRef.current.duration || 0
        }));
      }

      console.log('✅ playSong completed successfully');
      return { success: true, audioType };
    } catch (error) {
      if (error.message !== 'Operation cancelled') {
        console.error('❌ Error playing song:', error);
        setPlaybackState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
          isPlaying: false
        }));
      }
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    // Check if there's an error indicating no preview is available
    if (playbackState.error === 'No preview available') {
      console.log('🎵 Cannot play - no audio preview available');
      return;
    }

    // Check if audio element has a valid source
    if (!audioRef.current.src || audioRef.current.src === '') {
      console.log('🎵 Cannot play - no audio source loaded');
      return;
    }

    if (playbackState.isPlaying) {
      liveAudioManager.pause(audioRef.current);
    } else {
      liveAudioManager.playAudio(audioRef.current);
    }
  }, [playbackState.isPlaying, playbackState.error]);

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(() => {
    if (!audioRef.current) return;
    
    liveAudioManager.stop(audioRef.current);
    setCurrentSong(null);
  }, []);

  /**
   * Seek to specific time
   */
  const seekTo = useCallback((time) => {
    if (!audioRef.current) return;
    
    liveAudioManager.seek(audioRef.current, time);
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume) => {
    if (!audioRef.current) return;
    
    liveAudioManager.setVolume(audioRef.current, volume);
  }, []);

  /**
   * Skip to next song in playlist
   */
  const skipNext = useCallback((playlist, currentIndex) => {
    if (!playlist || playlist.length === 0) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.length) {
      playSong(playlist[nextIndex]);
      return nextIndex;
    }
    return currentIndex;
  }, [playSong]);

  /**
   * Skip to previous song in playlist
   */
  const skipPrevious = useCallback((playlist, currentIndex) => {
    if (!playlist || playlist.length === 0) return;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      playSong(playlist[prevIndex]);
      return prevIndex;
    }
    return currentIndex;
  }, [playSong]);

  /**
   * Get formatted time string
   */
  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Refs
    audioRef,
    
    // State
    playbackState,
    currentSong,
    
    // Actions
    playSong,
    togglePlayback,
    stopPlayback,
    seekTo,
    setVolume,
    skipNext,
    skipPrevious,
    
    // Utilities
    formatTime,
    
    // Computed values
    progress: playbackState.duration > 0 
      ? (playbackState.currentTime / playbackState.duration) * 100 
      : 0,
    
    currentTimeFormatted: formatTime(playbackState.currentTime),
    durationFormatted: formatTime(playbackState.duration),
    
    isBuffering: playbackState.isLoading,
    hasError: !!playbackState.error,
    hasNoPreview: playbackState.error === 'No preview available'
  };
};
