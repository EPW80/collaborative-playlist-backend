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

function MusicSearch({ open, onClose, playlistId, onSongAdded }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [addingStates, setAddingStates] = useState({});

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");

    try {
      let results = [];

      if (tabValue === 0) {
        // Spotify/Last.fm search
        const response = await searchAPI.tracks(searchQuery);
        results = response.data.data.tracks || [];
      } else {
        // Genius lyrics search
        const response = await lyricsAPI.search(searchQuery);
        results =
          response.data.data.hits?.map((hit) => ({
            id: hit.result.id,
            title: hit.result.title,
            artist: hit.result.primary_artist.name,
            album: hit.result.album?.name,
            image: hit.result.song_art_image_thumbnail_url,
            url: hit.result.url,
            source: "genius",
          })) || [];
      }

      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search for tracks. Please try again.");
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
          : (song.duration || 180), // Default to 3 minutes if no duration
        spotifyId: song.id || "",
      };

      // Validate required fields
      if (!songData.title || !songData.artist || !songData.duration) {
        throw new Error("Missing required song information (title, artist, or duration)");
      }

      if (typeof songData.duration !== 'number' || songData.duration <= 0) {
        songData.duration = 180; // Default duration
      }

      console.log("🎵 Adding song to playlist:", songData);

      const response = await songAPI.add(songData);
      console.log("✅ Song added successfully:", response.data);

      // Notify parent component
      if (onSongAdded) {
        onSongAdded(response.data.data.song);
      }

      // Remove the added song from results or show success
      setSearchResults((prev) => prev.filter((s) => s.id !== song.id));
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("❌ Add song error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Unknown error occurred";
                          
      setError(`Failed to add "${song.title || song.name}": ${errorMessage}`);
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
            <Alert severity="error" onClose={() => setError("")}>
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
