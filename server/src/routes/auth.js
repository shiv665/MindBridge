import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { protect } from "../middleware/auth.js";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/register", async (req, res) => {
  const { email, password, displayName } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email in use" });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, displayName, authProvider: 'local' });
  res.json({ token: generateToken(user.id), user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  if (user.authProvider === 'google') {
    return res.status(400).json({ message: "Please sign in with Google" });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });
  res.json({ token: generateToken(user.id), user });
});

// Google OAuth - verify token from frontend
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    
    if (user) {
      // If user exists with email but no googleId, link the accounts
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        email,
        displayName: name,
        googleId,
        avatar: picture,
        authProvider: 'google'
      });
    }
    
    res.json({ token: generateToken(user.id), user });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Google authentication failed" });
  }
});

router.get("/me", protect, async (req, res) => {
  const me = await User.findById(req.userId);
  res.json(me);
});

router.put("/me", protect, async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
  res.json(updated);
});

// Change password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (user.authProvider === 'google') {
      return res.status(400).json({ message: "Cannot change password for Google accounts" });
    }
    
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });
    
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to change password" });
  }
});

export default router;