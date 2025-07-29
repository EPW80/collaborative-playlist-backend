import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Box,
  Avatar,
} from "@mui/material";
import {
  PlayArrow,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  People,
  MusicNote,
  Public,
  Lock,
} from "@mui/icons-material";
import { playlistAPI } from "../services/api";

function PlaylistCard({
  playlist,
  onUpdate,
  onDelete,
  userPermissions,
  onNavigate,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState({});
  const [loading, setLoading] = useState(false);

  // Safety cleanup for invalid anchor elements
  useEffect(() => {
    const checkAnchors = () => {
      if (menuAnchor && !menuAnchor.isConnected) {
        setMenuAnchor(null);
      }
    };

    const interval = setInterval(checkAnchors, 100);
    return () => clearInterval(interval);
  }, [menuAnchor]);

  const canEdit =
    userPermissions?.permissions?.canEdit ||
    playlist.creator._id === userPermissions?.userId;
  const isOwner = playlist.creator._id === userPermissions?.userId;

  const handleEditClick = () => {
    setEditingPlaylist({
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic,
    });
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleUpdatePlaylist = async () => {
    setLoading(true);
    try {
      const response = await playlistAPI.update(playlist._id, editingPlaylist);
      onUpdate && onUpdate(response.data.data.playlist);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    setLoading(true);
    try {
      await playlistAPI.delete(playlist._id);
      onDelete && onDelete(playlist._id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              noWrap
              sx={{ flexGrow: 1, mr: 1 }}
            >
              {playlist.name}
            </Typography>
            {canEdit && (
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, minHeight: 40 }}
          >
            {playlist.description || "No description"}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={playlist.isPublic ? <Public /> : <Lock />}
              label={playlist.isPublic ? "Public" : "Private"}
              size="small"
              color={playlist.isPublic ? "success" : "warning"}
            />
            <Chip
              icon={<MusicNote />}
              label={`${playlist.songs?.length || 0} songs`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<People />}
              label={`${playlist.collaborators?.length || 0} collaborators`}
              size="small"
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.8rem" }}>
              {playlist.creator?.username?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              by {playlist.creator?.username}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: "space-between" }}>
          <Button
            size="small"
            startIcon={<PlayArrow />}
            onClick={() => onNavigate && onNavigate(playlist._id)}
          >
            Open Playlist
          </Button>
        </CardActions>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor) && menuAnchor?.isConnected !== false}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Playlist
        </MenuItem>
        {isOwner && (
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setMenuAnchor(null);
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Playlist
          </MenuItem>
        )}
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Playlist</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Playlist Name"
            value={editingPlaylist.name || ""}
            onChange={(e) =>
              setEditingPlaylist((prev) => ({ ...prev, name: e.target.value }))
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editingPlaylist.description || ""}
            onChange={(e) =>
              setEditingPlaylist((prev) => ({
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
                checked={editingPlaylist.isPublic || false}
                onChange={(e) =>
                  setEditingPlaylist((prev) => ({
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
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePlaylist}
            variant="contained"
            disabled={loading}
          >
            <SaveIcon sx={{ mr: 1 }} />
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Playlist</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All songs and collaborators will be
            removed.
          </Alert>
          <Typography>
            Are you sure you want to delete "{playlist.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePlaylist}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Delete Playlist
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PlaylistCard;
