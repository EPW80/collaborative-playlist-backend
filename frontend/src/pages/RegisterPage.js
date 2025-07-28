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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Person,
  CheckCircle,
  AdminPanelSettings,
  VpnKey,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Blockchain-inspired theme (same as LoginPage)
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

function RegisterPage() {
  const navigate = useNavigate();
  const { register, error, isLoading, clearError } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Default to blockchain dark theme
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    adminSecret: "",
  });
  const [validationError, setValidationError] = useState("");

  const theme = createBlockchainTheme(darkMode);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) clearError();
    if (validationError) setValidationError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    // Validate admin secret if admin role is selected
    if (formData.role === "admin" && !formData.adminSecret.trim()) {
      setValidationError(
        "Admin secret key is required for administrator accounts"
      );
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  const displayError = error || validationError;

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
            top: "5%",
            left: "5%",
            width: "120px",
            height: "120px",
            border: darkMode ? "2px solid #00e676" : "2px solid #1976d2",
            borderRadius: "20px",
            animation: "float 7s ease-in-out infinite",
            opacity: 0.2,
            "@keyframes float": {
              "0%": { transform: "translateY(0px) rotate(0deg)" },
              "50%": { transform: "translateY(-30px) rotate(180deg)" },
              "100%": { transform: "translateY(0px) rotate(360deg)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "70%",
            right: "10%",
            width: "90px",
            height: "90px",
            border: darkMode ? "2px solid #ff6d00" : "2px solid #ed6c02",
            borderRadius: "50%",
            animation: "float 9s ease-in-out infinite reverse",
            opacity: 0.15,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "10%",
            left: "15%",
            width: "70px",
            height: "70px",
            border: darkMode ? "2px solid #00e676" : "2px solid #1976d2",
            transform: "rotate(45deg)",
            animation: "float 11s ease-in-out infinite",
            opacity: 0.25,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "30%",
            right: "5%",
            width: "50px",
            height: "50px",
            backgroundColor: darkMode ? "#00e676" : "#1976d2",
            borderRadius: "8px",
            animation: "float 12s ease-in-out infinite",
            opacity: 0.1,
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
                      <AccountTree fontSize="large" />
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
                        icon={<Security />}
                        label="Secure"
                        size="small"
                        color="secondary"
                      />
                      <Chip
                        icon={<Speed />}
                        label="Fast"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography
                      component="h2"
                      variant="h5"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      Create Your Music Wallet
                    </Typography>
                  </Box>

                  {displayError && (
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
                        {displayError}
                      </Alert>
                    </Fade>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      autoComplete="username"
                      autoFocus
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="primary" />
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
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
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

                    <FormControl fullWidth margin="normal">
                      <InputLabel id="role-select-label">
                        Account Type
                      </InputLabel>
                      <Select
                        labelId="role-select-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={isLoading}
                        label="Account Type"
                        startAdornment={
                          <InputAdornment position="start">
                            <AdminPanelSettings color="primary" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="user">Standard User</MenuItem>
                        <MenuItem value="admin">Administrator</MenuItem>
                      </Select>
                    </FormControl>

                    {formData.role === "admin" && (
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="adminSecret"
                        label="Admin Secret Key"
                        type="password"
                        value={formData.adminSecret}
                        onChange={handleChange}
                        disabled={isLoading}
                        helperText="Enter the admin secret key to create an administrator account"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <VpnKey color="primary" />
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
                    )}

                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      autoComplete="new-password"
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

                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckCircle color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                              color="primary"
                            >
                              {showConfirmPassword ? (
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
                          Minting Wallet...
                        </Box>
                      ) : (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AccountTree />
                          Create Blockchain Wallet
                        </Box>
                      )}
                    </Button>

                    <Box textAlign="center">
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => navigate("/login")}
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
                        Already have a wallet? Access Chain
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

export default RegisterPage;
