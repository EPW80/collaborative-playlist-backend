/**
 * Optimized audio handling utilities for better performance
 */

/**
 * Audio loader with proper async handling and cancellation
 */
export class AudioManager {
  constructor() {
    this.currentOperation = null;
    this.audioCache = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load audio with caching and proper cancellation
   */
  async loadAudio(audioRef, url, abortController) {
    // Check if we're already loading this URL
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    // Check cache first
    if (this.audioCache.has(url)) {
      const cachedData = this.audioCache.get(url);
      if (!abortController.signal.aborted) {
        audioRef.src = cachedData.src;
        return Promise.resolve();
      }
    }

    // Create loading promise
    const loadingPromise = new Promise((resolve, reject) => {
      if (abortController.signal.aborted) {
        reject(new Error("Operation cancelled"));
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Audio loading timeout"));
      }, 5000); // Reduced timeout for better UX

      const cleanup = () => {
        clearTimeout(timeout);
        audioRef.removeEventListener("canplay", onCanPlay);
        audioRef.removeEventListener("loadeddata", onLoadedData);
        audioRef.removeEventListener("error", onError);
        this.loadingPromises.delete(url);
      };

      const onCanPlay = () => {
        cleanup();
        // Cache the loaded audio
        this.audioCache.set(url, { src: url, loadedAt: Date.now() });
        resolve();
      };

      const onLoadedData = () => {
        // Audio metadata is loaded, but may not be ready to play
        console.debug("🔊 Audio metadata loaded");
      };

      const onError = (error) => {
        cleanup();
        console.error("🚫 Audio loading error:", error);
        reject(error);
      };

      // Handle cancellation
      abortController.signal.addEventListener("abort", () => {
        cleanup();
        reject(new Error("Operation cancelled"));
      });

      // Set up event listeners
      audioRef.addEventListener("canplay", onCanPlay, { once: true });
      audioRef.addEventListener("loadeddata", onLoadedData, { once: true });
      audioRef.addEventListener("error", onError, { once: true });

      // Start loading
      audioRef.src = url;
      audioRef.currentTime = 0;
      audioRef.load();
    });

    // Store the promise
    this.loadingPromises.set(url, loadingPromise);

    return loadingPromise;
  }

  /**
   * Play audio with proper error handling
   */
  async playAudio(audioRef, abortController) {
    if (abortController.signal.aborted) {
      throw new Error("Operation cancelled");
    }

    try {
      // Modern browsers require user interaction for autoplay
      const playPromise = audioRef.play();

      if (playPromise !== undefined) {
        await playPromise;
      }

      return true;
    } catch (error) {
      // Handle different types of play errors
      if (error.name === "NotAllowedError") {
        throw new Error("Autoplay prevented - user interaction required");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Audio format not supported");
      } else if (error.name === "AbortError") {
        throw new Error("Play operation aborted");
      } else {
        throw error;
      }
    }
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [url, data] of this.audioCache.entries()) {
      if (now - data.loadedAt > maxAge) {
        this.audioCache.delete(url);
      }
    }
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
   * Clear all caches and operations
   */
  dispose() {
    this.cancelCurrentOperation();
    this.audioCache.clear();
    this.loadingPromises.clear();
  }
}
