import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  MusicNote as MusicIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import aiService from "../services/aiService";

const AISongRecommendations = ({
  open,
  onClose,
  playlistId,
  playlistName = "",
  onSongSelect,
  userPreferences = {},
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiEnabled, setAIEnabled] = useState(false);

  useEffect(() => {
    if (open && playlistId) {
      getRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playlistId]);

  const getRecommendations = async () => {
    if (!playlistId) {
      console.warn("No playlistId provided for recommendations");
      return;
    }

    console.log("🎵 Getting AI recommendations for playlist:", playlistId);
    setLoading(true);
    setError(null);

    try {
      const response = await aiService.getSongRecommendations(
        playlistId,
        userPreferences
      );
      console.log("✅ Recommendations response:", response);
      setRecommendations(response.data?.suggestions || []);
      setReasoning(response.data?.reasoning || "");
      setAIEnabled(response.data?.aiEnabled || false);
    } catch (error) {
      console.error("Error getting song recommendations:", error);
      setError(
        "Unable to get AI recommendations. Showing fallback suggestions."
      );
      // Provide fallback recommendations
      setRecommendations([
        {
          title: "Discover Weekly Mix",
          artist: "AI Assistant",
          reason: "A curated selection based on your playlist style",
          genre: "Mixed",
        },
        {
          title: "Similar Artists Radio",
          artist: "Various Artists",
          reason: "Explore artists with similar musical styles",
          genre: "Similar",
        },
        {
          title: "Mood-Based Selection",
          artist: "AI Curator",
          reason: "Songs that match the energy and mood of your playlist",
          genre: "Matched Mood",
        },
      ]);
      setReasoning(
        "Using smart fallback recommendations. AI features require a valid API key."
      );
      setAIEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = (song) => {
    if (onSongSelect) {
      onSongSelect(song);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AIIcon color="primary" />
        Song Recommendations
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Get new recommendations">
          <IconButton onClick={getRecommendations} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            For: {playlistName}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {aiEnabled
              ? "AI-powered recommendations based on your playlist style and preferences"
              : "Smart suggestions (AI features require API key)"}
          </Typography>

          {!aiEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Advanced AI recommendations are not available. Using smart
              fallback suggestions.
            </Alert>
          )}
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {reasoning && (
          <Card sx={{ mb: 2, bgcolor: "primary.50" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                <strong>AI Reasoning:</strong> {reasoning}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ mb: 2 }}>
          <Chip label="Recommended Songs" size="small" />
        </Divider>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {recommendations.map((song, index) => (
              <ListItem
                key={index}
                divider={index < recommendations.length - 1}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddSong(song)}
                  >
                    Add
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <MusicIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle1" component="div">
                        {song.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="div"
                      >
                        by {song.artist}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }} component="div">
                      {song.genre && (
                        <Chip
                          label={song.genre}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="div"
                      >
                        {song.reason}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {recommendations.length === 0 && !loading && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 3 }}
          >
            No recommendations available at the moment. Try adding more songs to
            your playlist first.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={getRecommendations}
          variant="contained"
          disabled={loading}
          startIcon={<RefreshIcon />}
        >
          Get New Suggestions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AISongRecommendations;
