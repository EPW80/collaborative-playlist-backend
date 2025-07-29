import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Psychology as AnalysisIcon,
  Recommend as RecommendIcon,
  Description as DescriptionIcon,
  SmartToy as SmartIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import aiService from "../services/aiService";

const AIFeaturesPanel = ({
  playlist,
  onPlaylistUpdate,
  onShowRecommendations,
  onShowNameGenerator,
}) => {
  const [aiStatus, setAIStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSmartPlaylist, setShowSmartPlaylist] = useState(false);
  const [smartPlaylistConfig, setSmartPlaylistConfig] = useState({
    seeds: [],
    autoName: true,
    autoDescription: true,
    isPublic: false,
  });

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const status = await aiService.getStatus();
      setAIStatus(status.data);
    } catch (error) {
      console.warn("Could not get AI status:", error);
      setAIStatus({ enabled: false, features: [] });
    }
  };

  const handleAnalyzePlaylist = async () => {
    if (!playlist?._id) return;

    setLoading(true);
    try {
      const response = await aiService.analyzePlaylist(playlist._id);
      setAnalysis(response.data);
      setShowAnalysis(true);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!playlist?._id) return;

    setLoading(true);
    try {
      const response = await aiService.generatePlaylistDescription(
        playlist._id,
        true
      );
      if (response.data?.updated) {
        onPlaylistUpdate?.();
      }
    } catch (error) {
      console.error("Description generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSmartPlaylist = async () => {
    setLoading(true);
    try {
      const response = await aiService.createSmartPlaylist(smartPlaylistConfig);
      console.log("Smart playlist created:", response.data);
      setShowSmartPlaylist(false);
      // Optionally redirect to the new playlist
    } catch (error) {
      console.error("Smart playlist creation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = aiService.getFeatureDescriptions();

  if (!aiStatus) {
    return (
      <Paper sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading AI features...
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <AIIcon sx={{ mr: 1, fontSize: 28, color: "primary.main" }} />
          <Typography variant="h5">AI-Powered Features</Typography>
          <Chip
            label={aiStatus.enabled ? "Active" : "Basic Mode"}
            color={aiStatus.enabled ? "success" : "warning"}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        {!aiStatus.enabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            AI features are running in basic mode. For advanced AI capabilities,
            configure an OpenAI API key.
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Playlist Name Generator */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <span style={{ fontSize: 20, marginRight: 8 }}>
                    {features.playlistNames.icon}
                  </span>
                  <Typography variant="h6">
                    {features.playlistNames.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {features.playlistNames.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={onShowNameGenerator}
                  disabled={!playlist?.songs?.length}
                >
                  Generate Names
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Song Recommendations */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <RecommendIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">
                    {features.songRecommendations.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {features.songRecommendations.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={onShowRecommendations}
                  disabled={!playlist?.songs?.length}
                >
                  Get Recommendations
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Playlist Analysis */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AnalysisIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">
                    {features.playlistAnalysis.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {features.playlistAnalysis.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={handleAnalyzePlaylist}
                  disabled={loading || !playlist?.songs?.length}
                >
                  Analyze Playlist
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Auto Description */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">
                    {features.autoDescription.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {features.autoDescription.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={handleGenerateDescription}
                  disabled={loading || !playlist?.songs?.length}
                >
                  Generate Description
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Smart Playlist Creator */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <SmartIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6">
                    {features.smartPlaylists.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {features.smartPlaylists.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => setShowSmartPlaylist(true)}
                  disabled={loading}
                >
                  Create Smart Playlist
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Analysis Results Dialog */}
      <Dialog
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <AnalysisIcon sx={{ mr: 1 }} />
          Playlist Analysis Results
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setShowAnalysis(false)}>
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent>
          {analysis && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Overall Mood
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {analysis.overallMood}
                  </Typography>

                  <Typography variant="h6" gutterBottom>
                    Energy Level
                  </Typography>
                  <Chip
                    label={analysis.energyLevel}
                    color={
                      analysis.energyLevel === "high"
                        ? "success"
                        : analysis.energyLevel === "medium"
                        ? "warning"
                        : "default"
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Dominant Genres
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {analysis.dominantGenres?.map((genre, index) => (
                      <Chip key={index} label={genre} sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Coherence Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {analysis.coherenceScore}%
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Key Highlights
                  </Typography>
                  {analysis.highlights?.map((highlight, index) => (
                    <Typography key={index} variant="body2" paragraph>
                      • {highlight}
                    </Typography>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Smart Playlist Creation Dialog */}
      <Dialog
        open={showSmartPlaylist}
        onClose={() => setShowSmartPlaylist(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Smart Playlist</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Seed Artists/Genres"
            placeholder="Enter artists, genres, or song names separated by commas"
            multiline
            rows={3}
            sx={{ mb: 2, mt: 1 }}
            value={smartPlaylistConfig.seeds.join(", ")}
            onChange={(e) =>
              setSmartPlaylistConfig({
                ...smartPlaylistConfig,
                seeds: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={smartPlaylistConfig.autoName}
                onChange={(e) =>
                  setSmartPlaylistConfig({
                    ...smartPlaylistConfig,
                    autoName: e.target.checked,
                  })
                }
              />
            }
            label="Auto-generate playlist name"
          />

          <FormControlLabel
            control={
              <Switch
                checked={smartPlaylistConfig.autoDescription}
                onChange={(e) =>
                  setSmartPlaylistConfig({
                    ...smartPlaylistConfig,
                    autoDescription: e.target.checked,
                  })
                }
              />
            }
            label="Auto-generate description"
          />

          <FormControlLabel
            control={
              <Switch
                checked={smartPlaylistConfig.isPublic}
                onChange={(e) =>
                  setSmartPlaylistConfig({
                    ...smartPlaylistConfig,
                    isPublic: e.target.checked,
                  })
                }
              />
            }
            label="Make playlist public"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSmartPlaylist(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSmartPlaylist}
            variant="contained"
            disabled={loading || smartPlaylistConfig.seeds.length === 0}
          >
            Create Playlist
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIFeaturesPanel;
