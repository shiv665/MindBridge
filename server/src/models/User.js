import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String }, // Optional for Google OAuth users
    displayName: { type: String, required: true },
    bio: String,
    interests: [String],
    avatar: String,
    googleId: { type: String, unique: true, sparse: true }, // For Google OAuth
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    // Profile visibility settings
    profileVisibility: {
      showEmail: { type: Boolean, default: false },
      showBio: { type: Boolean, default: true },
      showInterests: { type: Boolean, default: true },
      showCircles: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true }
    },
    // Online status
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false }
  },
  { timestamps: true }
);
export const User = mongoose.model("User", userSchema);