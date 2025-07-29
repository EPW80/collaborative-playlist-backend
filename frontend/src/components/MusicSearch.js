import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  List,
  Avatar,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  MusicNote,
  Album,
  Person,
  Close,
  AccessTime,
} from "@mui/icons-material";
import { searchAPI, songAPI, lyricsAPI } from "../services/api";

function MusicSearch({ open, onClose, playlistId, onSongAdded, existingSongs = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorSeverity, setErrorSeverity] = useState("error");
  const [tabValue, setTabValue] = useState(0);
  const [addingStates, setAddingStates] = useState({});

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setErrorSeverity("error");

    try {
      let results = [];

      if (tabValue === 0) {
        // Spotify/Last.fm search
        const response = await searchAPI.tracks(searchQuery);
        // Combine results from all services
        const apiResults = response.data.results || {};
        const spotifyTracks = apiResults.spotify || [];
        const lastfmTracks = apiResults.lastfm || [];
        results = [...spotifyTracks, ...lastfmTracks];
      } else {
        // Genius lyrics search
        const response = await lyricsAPI.search(searchQuery);
        results =
          response.data.data.results?.map((hit) => ({
            id: hit.id,
            title: hit.title,
            artist: hit.artist,
            album: hit.album,
            image: hit.thumbnail,
            url: hit.url,
            source: "genius",
          })) || [];
      }

      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(`Failed to search for tracks: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tabValue]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleAddSong = async (song) => {
    if (!playlistId) {
      setError("No playlist selected");
      return;
    }

    // Validate playlistId format (MongoDB ObjectId should be 24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(playlistId)) {
      setError("Invalid playlist ID format");
      return;
    }

    // Check for duplicates in existing songs before making API request
    const songTitle = song.title || song.name || "Unknown Title";
    const songArtist = song.artist || (song.artists && song.artists[0]?.name) || "Unknown Artist";
    
    const isDuplicate = existingSongs.some(existingSong => {
      const existingTitle = (existingSong?.title || "").toLowerCase().trim();
      const existingArtist = (existingSong?.artist || "").toLowerCase().trim();
      const searchTitle = songTitle.toLowerCase().trim();
      const searchArtist = songArtist.toLowerCase().trim();
      
      return existingTitle === searchTitle && existingArtist === searchArtist;
    });
    
    if (isDuplicate) {
      setError(`"${songTitle}" by ${songArtist} is already in this playlist`);
      setErrorSeverity("warning");
      // Remove the song from results since it's already in the playlist
      setSearchResults((prev) => prev.filter((s) => s.id !== song.id));
      return;
    }

    setAddingStates((prev) => ({ ...prev, [song.id]: true }));

    try {
      // Construct song data with proper validation
      const songData = {
        playlistId,
        title: song.title || song.name || "Unknown Title",
        artist: song.artist || (song.artists && song.artists[0]?.name) || "Unknown Artist",
        album: song.album || song.album?.name || "",
        duration: song.duration_ms
          ? Math.floor(song.duration_ms / 1000)
          : Math.floor(song.duration || 180), // Ensure integer, default to 3 minutes if no duration
        ...(song.id && song.id.trim() !== "" && { spotifyId: song.id }),
      };

      // For Genius API results, ensure proper data handling
      if (song.source === "genius") {
        // Don't include spotifyId for Genius songs - let it be undefined
        songData.duration = 180; // Default duration for Genius songs
      }

      // Validate required fields
      if (!songData.title || !songData.artist || !songData.duration) {
        throw new Error("Missing required song information (title, artist, or duration)");
      }

      if (typeof songData.duration !== 'number' || songData.duration <= 0) {
        songData.duration = 180; // Default duration
      }

      // Ensure duration is always an integer (required by backend validation)
      songData.duration = Math.floor(songData.duration);

      // Validate field lengths (backend has length limits)
      if (songData.title.length > 200) {
        songData.title = songData.title.substring(0, 200);
      }
      if (songData.artist.length > 200) {
        songData.artist = songData.artist.substring(0, 200);
      }
      if (songData.album.length > 200) {
        songData.album = songData.album.substring(0, 200);
      }

      console.log("🎵 Adding song to playlist:", songData);
      console.log("🔍 Song data validation:", {
        titleLength: songData.title.length,
        artistLength: songData.artist.length,
        albumLength: songData.album.length,
        duration: songData.duration,
        durationType: typeof songData.duration,
        playlistIdLength: songData.playlistId.length,
        spotifyIdLength: songData.spotifyId.length,
        songSource: song.source || "spotify/lastfm"
      });

      const response = await songAPI.add(songData);
      console.log("✅ Song added successfully:", response.data);

      // Notify parent component
      if (onSongAdded) {
        onSongAdded(response.data.data.song);
      }

      // Remove the added song from results or show success
      setSearchResults((prev) => prev.filter((s) => s.id !== song.id));
      setError(""); // Clear any previous errors
      setErrorSeverity("error"); // Reset severity
    } catch (err) {
      console.error("❌ Add song error:", err);
      console.error("Error response:", err.response?.data);
      
      // Detailed error extraction
      let errorMessage = "Unknown error occurred";
      let isWarning = false;
      
      if (err.response?.data?.errors) {
        // Handle validation errors array
        const validationErrors = err.response.data.errors;
        console.error("Validation errors:", validationErrors);
        
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors.map(error => error.msg || error.message || error).join(", ");
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        
        // Check if this is a duplicate song warning rather than an error
        if (errorMessage.toLowerCase().includes("already exists") || 
            errorMessage.toLowerCase().includes("duplicate")) {
          isWarning = true;
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        
        // Check if this is a duplicate song warning rather than an error
        if (errorMessage.toLowerCase().includes("already exists") || 
            errorMessage.toLowerCase().includes("duplicate")) {
          isWarning = true;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // For duplicate songs, show a friendlier message and remove from results
      if (isWarning) {
        setError(`"${song.title || song.name}" is already in this playlist`);
        setErrorSeverity("warning");
        // Still remove the song from results since it's already added
        setSearchResults((prev) => prev.filter((s) => s.id !== song.id));
      } else {
        setError(`Failed to add "${song.title || song.name}": ${errorMessage}`);
        setErrorSeverity("error");
      }
    } finally {
      setAddingStates((prev) => ({ ...prev, [song.id]: false }));
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return "";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    setErrorSeverity("error");
    setTabValue(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          border: "1px solid rgba(25, 118, 210, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(45deg, #1976d2, #00e676)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MusicNote />
        Add Music to Playlist
        <IconButton
          onClick={handleClose}
          sx={{ ml: "auto", color: "text.secondary" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="🎵 Spotify/Last.fm" />
            <Tab label="📖 Genius Lyrics" />
          </Tabs>
        </Box>

        {/* Search Input */}
        <Box sx={{ p: 3, pb: 2 }}>
          <TextField
            fullWidth
            placeholder={
              tabValue === 0
                ? "Search for songs, artists, or albums..."
                : "Search for songs with lyrics..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
              sx: {
                borderRadius: 2,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(25, 118, 210, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              },
            }}
          />
        </Box>

        {/* Error Alert */}
        {error && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity={errorSeverity} onClose={() => {
              setError("");
              setErrorSeverity("error");
            }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Search Results */}
        <Box sx={{ maxHeight: 400, overflow: "auto", px: 3, pb: 3 }}>
          {searchResults.length > 0 ? (
            <List>
              {searchResults.map((song, index) => (
                <Card key={`${song.id}-${index}`} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={song.album?.images?.[0]?.url || song.image}
                        sx={{
                          width: 56,
                          height: 56,
                          background:
                            "linear-gradient(45deg, #1976d2, #00e676)",
                        }}
                      >
                        <MusicNote />
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap>
                          {song.title || song.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          <Person sx={{ fontSize: 16, mr: 0.5 }} />
                          {song.artist ||
                            (song.artists && song.artists[0]?.name)}
                        </Typography>
                        {(song.album || song.album?.name) && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            <Album sx={{ fontSize: 16, mr: 0.5 }} />
                            {song.album?.name || song.album}
                          </Typography>
                        )}
                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                          {song.duration_ms && (
                            <Chip
                              size="small"
                              icon={<AccessTime />}
                              label={formatDuration(song.duration_ms)}
                              variant="outlined"
                            />
                          )}
                          {song.source && (
                            <Chip
                              size="small"
                              label={song.source}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        startIcon={
                          addingStates[song.id] ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <AddIcon />
                          )
                        }
                        onClick={() => handleAddSong(song)}
                        disabled={addingStates[song.id]}
                        sx={{
                          background:
                            "linear-gradient(45deg, #00e676, #1976d2)",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #00c853, #1565c0)",
                          },
                        }}
                      >
                        {addingStates[song.id] ? "Adding..." : "Add"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          ) : (
            !loading &&
            searchQuery && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <MusicNote
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No tracks found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different search terms or check your spelling
                </Typography>
              </Box>
            )
          )}

          {!searchQuery && !loading && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <SearchIcon
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                Search for Music
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter a song name, artist, or album to get started
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default MusicSearch;
