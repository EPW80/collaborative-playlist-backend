import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
} from "@mui/material";
import { Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { playlistAPI } from "../services/api";

function CreatePlaylistDialog({ open, onClose, onPlaylistCreated }) {
  const [playlistData, setPlaylistData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!playlistData.name.trim()) {
      setError("Playlist name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await playlistAPI.create(playlistData);
      onPlaylistCreated && onPlaylistCreated(response.data.data.playlist);
      setPlaylistData({ name: "", description: "", isPublic: false });
      onClose();
    } catch (error) {
      console.error("Error creating playlist:", error);
      setError(error.response?.data?.message || "Failed to create playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPlaylistData({ name: "", description: "", isPublic: false });
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Playlist</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Playlist Name"
          value={playlistData.name}
          onChange={(e) =>
            setPlaylistData((prev) => ({ ...prev, name: e.target.value }))
          }
          margin="normal"
          required
          error={!!error && !playlistData.name.trim()}
        />
        <TextField
          fullWidth
          label="Description (optional)"
          value={playlistData.description}
          onChange={(e) =>
            setPlaylistData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          margin="normal"
          multiline
          rows={3}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={playlistData.isPublic}
              onChange={(e) =>
                setPlaylistData((prev) => ({
                  ...prev,
                  isPublic: e.target.checked,
                }))
              }
            />
          }
          label="Make playlist public"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          <CancelIcon sx={{ mr: 1 }} />
          Cancel
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={loading}>
          <SaveIcon sx={{ mr: 1 }} />
          Create Playlist
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreatePlaylistDialog;
