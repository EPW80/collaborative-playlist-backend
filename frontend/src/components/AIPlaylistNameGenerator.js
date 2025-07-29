import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import aiService from "../services/aiService";

const AIPlaylistNameGenerator = ({
  open,
  onClose,
  songs = [],
  onNameSelected,
  currentName = "",
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customName, setCustomName] = useState(currentName);
  const [aiEnabled, setAIEnabled] = useState(false);

  useEffect(() => {
    if (open && songs.length > 0) {
      checkAIStatus();
      generateNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, songs]);

  const checkAIStatus = async () => {
    try {
      const available = await aiService.isAIAvailable();
      setAIEnabled(available);
    } catch (error) {
      console.warn("Could not check AI status:", error);
      setAIEnabled(false);
    }
  };

  const generateNames = async () => {
    if (songs.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await aiService.generatePlaylistNames(songs);
      setSuggestions(response.data?.suggestions || []);
      setAIEnabled(response.data?.aiEnabled || false);
    } catch (error) {
      setError(error.message);
      // Provide fallback suggestions
      setSuggestions([
        "My Awesome Mix",
        "Musical Journey",
        "Favorites Collection",
        "Sound Waves",
        "Rhythm & Blues",
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNameSelect = (name) => {
    setCustomName(name);
  };

  const handleConfirm = () => {
    if (customName.trim()) {
      onNameSelected(customName.trim());
      onClose();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AIIcon color="primary" />
        Smart Playlist Names
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Regenerate suggestions">
          <IconButton onClick={generateNames} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {aiEnabled
              ? `AI-powered suggestions based on ${songs.length} songs`
              : "Smart suggestions (AI features require API key)"}
          </Typography>

          {!aiEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Advanced AI features are not available. Using smart fallback
              suggestions.
            </Alert>
          )}
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Playlist Name"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Enter a custom name or select from suggestions"
        />

        <Divider sx={{ mb: 2 }}>
          <Chip label="AI Suggestions" size="small" />
        </Divider>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={index}
                disablePadding
                secondaryAction={
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(suggestion)}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton
                  onClick={() => handleNameSelect(suggestion)}
                  selected={customName === suggestion}
                >
                  <ListItemText
                    primary={suggestion}
                    secondary={aiEnabled ? "AI Generated" : "Smart Suggestion"}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {suggestions.length === 0 && !loading && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            No suggestions available. Enter a custom name above.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!customName.trim()}
          startIcon={<AIIcon />}
        >
          Use This Name
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIPlaylistNameGenerator;
