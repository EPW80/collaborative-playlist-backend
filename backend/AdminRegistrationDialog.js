import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperAdminIcon,
  Person as UserIcon,
  Moderation as ModeratorIcon,
} from '@mui/icons-material';

const AdminRegistrationDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    adminSecret: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleConfig = {
    user: {
      label: 'Regular User',
      icon: <UserIcon />,
      color: 'default',
      description: 'Standard user with basic permissions',
      requiresSecret: false,
    },
    moderator: {
      label: 'Moderator',
      icon: <ModeratorIcon />,
      color: 'primary',
      description: 'Enhanced permissions for content moderation',
      requiresSecret: true,
    },
    admin: {
      label: 'Administrator',
      icon: <AdminIcon />,
      color: 'warning',
      description: 'Full administrative access to manage users and content',
      requiresSecret: true,
    },
    superadmin: {
      label: 'Super Administrator',
      icon: <SuperAdminIcon />,
      color: 'error',
      description: 'Highest level access with system-wide control',
      requiresSecret: true,
    },
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare payload
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      // Add role and adminSecret only if not a regular user
      if (formData.role !== 'user') {
        payload.role = formData.role;
        payload.adminSecret = formData.adminSecret;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success
      if (onSuccess) {
        onSuccess(data.data.user);
      }
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
      adminSecret: '',
    });
    setError('');
    onClose();
  };

  const selectedRole = roleConfig[formData.role];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonAddIcon />
          <Typography variant="h6">Register New User</Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Username"
              value={formData.username}
              onChange={handleInputChange('username')}
              required
              fullWidth
              inputProps={{ minLength: 3, maxLength: 30 }}
              helperText="3-30 characters"
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              fullWidth
            />

            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
              helperText="Minimum 6 characters"
            />

            <FormControl fullWidth>
              <InputLabel>User Role</InputLabel>
              <Select
                value={formData.role}
                onChange={handleInputChange('role')}
                label="User Role"
              >
                {Object.entries(roleConfig).map(([value, config]) => (
                  <MenuItem key={value} value={value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {config.icon}
                      <Typography>{config.label}</Typography>
                      <Chip
                        size="small"
                        label={value}
                        color={config.color}
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Role Description */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {selectedRole.icon}
                <Typography variant="subtitle2" color={`${selectedRole.color}.main`}>
                  {selectedRole.label}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {selectedRole.description}
              </Typography>
            </Box>

            {/* Admin Secret Field */}
            {selectedRole.requiresSecret && (
              <TextField
                label="Admin Secret"
                type="password"
                value={formData.adminSecret}
                onChange={handleInputChange('adminSecret')}
                required
                fullWidth
                helperText="Required for elevated roles"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'warning.light',
                    opacity: 0.1,
                  },
                }}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            color={selectedRole.color}
            startIcon={selectedRole.icon}
          >
            {loading ? 'Creating...' : `Create ${selectedRole.label}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminRegistrationDialog;
