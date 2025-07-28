import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  Switch,
  FormControlLabel,
  Avatar,
  Fade,
  Slide,
  Chip,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Security,
  AccountTree,
  Visibility,
  VisibilityOff,
  Speed,
  Brightness4,
  Brightness7,
  Lock,
  Email,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Blockchain-inspired theme
const createBlockchainTheme = (darkMode) => {
  return createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#00e676" : "#1976d2",
        light: darkMode ? "#66ffa6" : "#42a5f5",
        dark: darkMode ? "#00c853" : "#1565c0",
      },
      secondary: {
        main: darkMode ? "#ff6d00" : "#ed6c02",
        light: darkMode ? "#ff9800" : "#ff9800",
        dark: darkMode ? "#e65100" : "#e65100",
      },
      background: {
        default: darkMode ? "#0a0a0a" : "#f5f5f5",
        paper: darkMode ? "#1a1a1a" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#00e676" : "#1976d2",
        secondary: darkMode ? "#b0bec5" : "#546e7a",
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: darkMode
              ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: darkMode ? "1px solid #00e676" : "1px solid #e0e0e0",
            borderRadius: "16px",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: darkMode
                ? "0 12px 30px rgba(0, 230, 118, 0.3)"
                : "0 12px 30px rgba(0, 0, 0, 0.15)",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-1px)",
              },
              "&.Mui-focused": {
                transform: "translateY(-2px)",
                boxShadow: darkMode
                  ? "0 4px 12px rgba(0, 230, 118, 0.2)"
                  : "0 4px 12px rgba(25, 118, 210, 0.2)",
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            padding: "12px 24px",
            transition: "all 0.3s ease-in-out",
            background: darkMode
              ? "linear-gradient(135deg, #00e676, #00c853)"
              : "linear-gradient(135deg, #1976d2, #1565c0)",
            "&:hover": {
              transform: "translateY(-2px)",
              background: darkMode
                ? "linear-gradient(135deg, #00c853, #00a145)"
                : "linear-gradient(135deg, #1565c0, #0d47a1)",
              boxShadow: darkMode
                ? "0 8px 20px rgba(0, 230, 118, 0.3)"
                : "0 8px 20px rgba(25, 118, 210, 0.3)",
            },
          },
        },
      },
    },
  });
};

function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading, clearError } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Default to blockchain dark theme
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const theme = createBlockchainTheme(darkMode);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 LoginPage: Submitting login form", formData);
    
    const result = await login(formData);
    console.log("🎯 LoginPage: Login result:", result);
    
    if (result.success) {
      console.log("✅ LoginPage: Login successful, navigating to dashboard");
      navigate("/dashboard");
    } else {
      console.log("❌ LoginPage: Login failed:", result.error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          background: darkMode
            ? "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)"
            : "linear-gradient(135deg, #f5f5f5 0%, #e3f2fd 50%, #bbdefb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blockchain-inspired animated background elements */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "100px",
            height: "100px",
            border: darkMode ? "2px solid #00e676" : "2px solid #1976d2",
            borderRadius: "16px",
            animation: "float 6s ease-in-out infinite",
            opacity: 0.3,
            "@keyframes float": {
              "0%": { transform: "translateY(0px) rotate(0deg)" },
              "50%": { transform: "translateY(-20px) rotate(180deg)" },
              "100%": { transform: "translateY(0px) rotate(360deg)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "60%",
            right: "15%",
            width: "80px",
            height: "80px",
            border: darkMode ? "2px solid #ff6d00" : "2px solid #ed6c02",
            borderRadius: "50%",
            animation: "float 8s ease-in-out infinite reverse",
            opacity: 0.2,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "20%",
            left: "20%",
            width: "60px",
            height: "60px",
            border: darkMode ? "2px solid #00e676" : "2px solid #1976d2",
            transform: "rotate(45deg)",
            animation: "float 10s ease-in-out infinite",
            opacity: 0.25,
          }}
        />

        <Container component="main" maxWidth="sm">
          <Fade in={true} timeout={800}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Dark Mode Toggle */}
              <Box sx={{ alignSelf: "flex-end", mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
                <IconButton
                  onClick={() => setDarkMode(!darkMode)}
                  sx={{ ml: 1, color: "primary.main" }}
                >
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Box>

              <Slide direction="up" in={true} timeout={600}>
                <Paper
                  elevation={12}
                  sx={{
                    padding: 4,
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Header with Blockchain Theme */}
                  <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Avatar
                      sx={{
                        mx: "auto",
                        mb: 2,
                        width: 64,
                        height: 64,
                        background: darkMode
                          ? "linear-gradient(135deg, #00e676, #00c853)"
                          : "linear-gradient(135deg, #1976d2, #1565c0)",
                      }}
                    >
                      <Security fontSize="large" />
                    </Avatar>

                    <Typography
                      component="h1"
                      variant="h4"
                      sx={{
                        fontWeight: "bold",
                        background: darkMode
                          ? "linear-gradient(135deg, #00e676, #66ffa6)"
                          : "linear-gradient(135deg, #1976d2, #42a5f5)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 1,
                      }}
                    >
                      BlockBeats
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Chip
                        icon={<AccountTree />}
                        label="Decentralized"
                        size="small"
                        color="primary"
                      />
                      <Chip
                        icon={<Speed />}
                        label="Secure"
                        size="small"
                        color="secondary"
                      />
                    </Box>

                    <Typography
                      component="h2"
                      variant="h5"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      Access Your Music Chain
                    </Typography>
                  </Box>

                  {error && (
                    <Fade in={true}>
                      <Alert
                        severity="error"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          "& .MuiAlert-icon": {
                            color: darkMode ? "#ff6b6b" : "#d32f2f",
                          },
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "text.secondary",
                          fontWeight: 500,
                        },
                      }}
                    />

                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              color="primary"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "text.secondary",
                          fontWeight: 500,
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Speed
                            sx={{ animation: "spin 1s linear infinite" }}
                          />
                          Connecting to Chain...
                        </Box>
                      ) : (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Security />
                          Access Blockchain
                        </Box>
                      )}
                    </Button>

                    <Box textAlign="center">
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => navigate("/register")}
                        type="button"
                        sx={{
                          color: "primary.main",
                          fontWeight: 500,
                          textDecoration: "none",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            textDecoration: "underline",
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        Need to mint a new wallet? Create Account
                      </Link>
                    </Box>
                  </Box>
                </Paper>
              </Slide>
            </Box>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default LoginPage;
