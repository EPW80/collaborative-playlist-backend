const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Helper function to format user response
const formatUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
  };
};

// Register a new user
exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 400, errors.array()));
  }

  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const message =
      existingUser.email === email
        ? "Email already registered"
        : "Username already taken";
    return next(new AppError(message, 409));
  }

  // Create new user
  const user = new User({ username, email, password });
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Log registration event
  console.log(`✅ New user registered: ${user.username} (${user.email})`);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      token,
      user: formatUserResponse(user),
    },
  });
});

// Login user
exports.login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 400, errors.array()));
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Generate token
  const token = generateToken(user._id);

  // Log login event
  console.log(`✅ User logged in: ${user.username} (${user.email})`);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: formatUserResponse(user),
    },
  });
});

// Get current user profile
exports.getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.json({
    success: true,
    data: {
      user: formatUserResponse(user),
    },
  });
});

// Update user profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 400, errors.array()));
  }

  const { username, profilePicture } = req.body;
  const updates = {};

  // Check if username is being updated and if it's available
  if (username && username !== req.user?.username) {
    const existingUser = await User.findOne({
      username,
      _id: { $ne: req.userId },
    });

    if (existingUser) {
      return next(new AppError("Username already taken", 409));
    }
    updates.username = username;
  }

  if (profilePicture !== undefined) {
    updates.profilePicture = profilePicture;
  }

  const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  console.log(`✅ User profile updated: ${updatedUser.username}`);

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: formatUserResponse(updatedUser),
    },
  });
});

// Change password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 400, errors.array()));
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError("Current password is incorrect", 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  console.log(`✅ Password changed for user: ${user.username}`);

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

// Delete user account
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Verify password before deletion
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError("Password is incorrect", 401));
  }

  // Delete user's playlists and songs
  const Playlist = require("../models/Playlist");
  const Song = require("../models/Song");

  const userPlaylists = await Playlist.find({ creator: req.userId });
  for (const playlist of userPlaylists) {
    await Song.deleteMany({ playlist: playlist._id });
    await Playlist.findByIdAndDelete(playlist._id);
  }

  // Remove user from other playlists' collaborators
  await Playlist.updateMany(
    { "collaborators.user": req.userId },
    { $pull: { collaborators: { user: req.userId } } }
  );

  // Delete the user
  await User.findByIdAndDelete(req.userId);

  console.log(`✅ User account deleted: ${user.username} (${user.email})`);

  res.json({
    success: true,
    message: "Account deleted successfully",
  });
});
