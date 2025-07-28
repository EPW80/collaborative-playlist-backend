const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
    spotifyId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin", "superadmin"],
      default: "user",
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAdmin = function () {
  return this.role === "admin" || this.role === "superadmin";
};

userSchema.methods.isSuperAdmin = function () {
  return this.role === "superadmin";
};

userSchema.methods.hasRoleLevel = function (requiredRole) {
  const roleHierarchy = {
    user: 1,
    moderator: 2,
    admin: 3,
    superadmin: 4,
  };
  return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

// Database indexes for performance optimization
// Note: email and username already have unique indexes from schema definitions
userSchema.index({ createdAt: -1 });
userSchema.index({ spotifyId: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);
