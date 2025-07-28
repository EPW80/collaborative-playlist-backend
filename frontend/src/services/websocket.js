import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket && this.connected) {
      return;
    }

    const serverUrl =
      process.env.REACT_APP_WEBSOCKET_URL ||
      "https://collaborative-playlist-backend.onrender.com";

    console.log("Connecting to WebSocket server:", serverUrl);

    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.connected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      console.error("Error details:", {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
      });
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Playlist collaboration events
  joinPlaylist(playlistId) {
    if (this.socket && this.connected) {
      this.socket.emit("join-playlist", playlistId);
    }
  }

  leavePlaylist(playlistId) {
    if (this.socket && this.connected) {
      this.socket.emit("leave-playlist", playlistId);
    }
  }

  // Real-time playlist updates
  onPlaylistUpdate(callback) {
    if (this.socket) {
      this.socket.on("playlist-updated", callback);
    }
  }

  onSongAdded(callback) {
    if (this.socket) {
      this.socket.on("song-added", callback);
    }
  }

  onSongRemoved(callback) {
    if (this.socket) {
      this.socket.on("song-removed", callback);
    }
  }

  onCollaboratorAdded(callback) {
    if (this.socket) {
      this.socket.on("collaborator-added", callback);
    }
  }

  onCollaboratorRemoved(callback) {
    if (this.socket) {
      this.socket.on("collaborator-removed", callback);
    }
  }

  // Suggestion events
  onSuggestionReceived(callback) {
    if (this.socket) {
      this.socket.on("suggestion-received", callback);
    }
  }

  onSuggestionApproved(callback) {
    if (this.socket) {
      this.socket.on("suggestion-approved", callback);
    }
  }

  onSuggestionRejected(callback) {
    if (this.socket) {
      this.socket.on("suggestion-rejected", callback);
    }
  }

  // Active users
  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on("user-joined", callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on("user-left", callback);
    }
  }

  onActiveUsersUpdate(callback) {
    if (this.socket) {
      this.socket.on("active-users-update", callback);
    }
  }

  // Player synchronization
  onPlayerSync(callback) {
    if (this.socket) {
      this.socket.on("player-sync", callback);
    }
  }

  syncPlayer(playlistId, playerState) {
    if (this.socket && this.connected) {
      this.socket.emit("sync-player", {
        playlistId,
        playerState,
      });
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
