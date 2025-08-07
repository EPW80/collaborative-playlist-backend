/**
 * Live Audio Playback Manager
 * Handles real-time audio streaming and synchronization
 */

export class LiveAudioManager {
  constructor() {
    this.audioContext = null;
    this.currentSource = null;
    this.isInitialized = false;
    this.currentOperation = null;
    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      buffered: 0
    };
    this.listeners = new Set();
    this.bufferCheckInterval = null;
    this.syncInterval = null;
  }

  /**
   * Initialize Web Audio API for better performance
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Use Web Audio API for better performance and control
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('🎵 Live Audio Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Load and prepare audio for playback with minimal latency
   */
  async loadAudio(audioElement, url, abortController) {
    await this.initialize();

    if (abortController?.signal.aborted) {
      throw new Error('Operation cancelled');
    }

    // Cancel any existing operation
    this.cancelCurrentOperation();
    this.currentOperation = abortController;

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        audioElement.removeEventListener('loadstart', onLoadStart);
        audioElement.removeEventListener('canplay', onCanPlay);
        audioElement.removeEventListener('error', onError);
        audioElement.removeEventListener('progress', onProgress);
      };

      const onLoadStart = () => {
        console.log('🔄 Audio loading started');
        this.notifyListeners('loadstart');
      };

      const onCanPlay = () => {
        cleanup();
        console.log('✅ Audio ready to play');
        this.updatePlaybackState({ duration: audioElement.duration });
        this.notifyListeners('canplay');
        resolve();
      };

      const onError = (error) => {
        cleanup();
        console.error('❌ Audio loading error:', error);
        this.notifyListeners('error', error);
        reject(error);
      };

      const onProgress = () => {
        if (audioElement.buffered.length > 0) {
          const buffered = audioElement.buffered.end(0) / audioElement.duration;
          this.updatePlaybackState({ buffered });
          this.notifyListeners('progress', { buffered });
        }
      };

      // Handle operation cancellation
      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          cleanup();
          reject(new Error('Operation cancelled'));
        });
      }

      // Set up event listeners
      audioElement.addEventListener('loadstart', onLoadStart);
      audioElement.addEventListener('canplay', onCanPlay);
      audioElement.addEventListener('error', onError);
      audioElement.addEventListener('progress', onProgress);

      // Optimize loading settings
      audioElement.preload = 'metadata';
      audioElement.crossOrigin = 'anonymous';
      
      // Start loading
      audioElement.src = url;
      audioElement.load();
    });
  }

  /**
   * Play audio with optimized performance
   */
  async playAudio(audioElement, startTime = 0) {
    await this.initialize();

    try {
      // Set start time if specified
      if (startTime > 0) {
        audioElement.currentTime = startTime;
      }

      // Start playback
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }

      // Update state and start monitoring
      this.updatePlaybackState({ 
        isPlaying: true, 
        currentTime: audioElement.currentTime 
      });

      this.startRealTimeUpdates(audioElement);
      this.notifyListeners('play');

      console.log('▶️ Audio playback started');
      return true;
    } catch (error) {
      this.updatePlaybackState({ isPlaying: false });
      this.notifyListeners('error', error);
      
      // Provide specific error handling
      if (error.name === 'NotAllowedError') {
        throw new Error('Autoplay prevented - user interaction required');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Audio format not supported');
      }
      throw error;
    }
  }

  /**
   * Pause audio playback
   */
  pause(audioElement) {
    try {
      audioElement.pause();
      this.updatePlaybackState({ isPlaying: false });
      this.stopRealTimeUpdates();
      this.notifyListeners('pause');
      console.log('⏸️ Audio playback paused');
    } catch (error) {
      console.error('❌ Error pausing audio:', error);
    }
  }

  /**
   * Stop audio playback and reset
   */
  stop(audioElement) {
    try {
      audioElement.pause();
      audioElement.currentTime = 0;
      this.updatePlaybackState({ 
        isPlaying: false, 
        currentTime: 0 
      });
      this.stopRealTimeUpdates();
      this.notifyListeners('stop');
      console.log('⏹️ Audio playback stopped');
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
    }
  }

  /**
   * Seek to specific time
   */
  seek(audioElement, time) {
    try {
      audioElement.currentTime = Math.max(0, Math.min(time, audioElement.duration));
      this.updatePlaybackState({ currentTime: audioElement.currentTime });
      this.notifyListeners('seek', { time: audioElement.currentTime });
      console.log(`⏭️ Seeked to ${audioElement.currentTime}s`);
    } catch (error) {
      console.error('❌ Error seeking audio:', error);
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(audioElement, volume) {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      audioElement.volume = clampedVolume;
      this.updatePlaybackState({ volume: clampedVolume });
      this.notifyListeners('volumechange', { volume: clampedVolume });
    } catch (error) {
      console.error('❌ Error setting volume:', error);
    }
  }

  /**
   * Start real-time updates for playback position
   */
  startRealTimeUpdates(audioElement) {
    this.stopRealTimeUpdates();

    // High-frequency updates for smooth progress
    this.syncInterval = setInterval(() => {
      if (!audioElement.paused) {
        this.updatePlaybackState({ 
          currentTime: audioElement.currentTime,
          buffered: audioElement.buffered.length > 0 
            ? audioElement.buffered.end(0) / audioElement.duration 
            : 0
        });
        this.notifyListeners('timeupdate', { 
          currentTime: audioElement.currentTime 
        });
      }
    }, 100); // 10fps for smooth updates

    // Buffer monitoring
    this.bufferCheckInterval = setInterval(() => {
      this.checkBufferHealth(audioElement);
    }, 1000);
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.bufferCheckInterval) {
      clearInterval(this.bufferCheckInterval);
      this.bufferCheckInterval = null;
    }
  }

  /**
   * Monitor buffer health for smooth playback
   */
  checkBufferHealth(audioElement) {
    if (audioElement.buffered.length === 0) return;

    const currentTime = audioElement.currentTime;
    const bufferedEnd = audioElement.buffered.end(0);
    const bufferAhead = bufferedEnd - currentTime;

    // Warn if buffer is running low
    if (bufferAhead < 5 && !audioElement.paused) {
      this.notifyListeners('bufferlow', { bufferAhead });
    }
  }

  /**
   * Update internal playback state
   */
  updatePlaybackState(updates) {
    Object.assign(this.playbackState, updates);
  }

  /**
   * Get current playback state
   */
  getPlaybackState() {
    return { ...this.playbackState };
  }

  /**
   * Add event listener
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of events
   */
  notifyListeners(eventType, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('❌ Error in audio event listener:', error);
      }
    });
  }

  /**
   * Cancel current operation
   */
  cancelCurrentOperation() {
    if (this.currentOperation) {
      this.currentOperation.abort();
      this.currentOperation = null;
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopRealTimeUpdates();
    this.cancelCurrentOperation();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.listeners.clear();
    console.log('🧹 Live Audio Manager disposed');
  }
}

// Export singleton instance
export const liveAudioManager = new LiveAudioManager();
