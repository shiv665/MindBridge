import { Router } from "express";
import { User } from "../models/User.js";
import { Circle } from "../models/Circle.js";
import { Block } from "../models/Block.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Get all users (for discovery/search)
router.get("/", protect, async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { _id: { $ne: req.userId } }; // Exclude current user
    
    if (q) {
      filter.$or = [
        { displayName: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
        { interests: { $regex: q, $options: "i" } }
      ];
    }
    
    // Get blocked users to exclude
    const blocks = await Block.find({
      $or: [{ blocker: req.userId }, { blocked: req.userId }]
    });
    const blockedIds = blocks.map(b => 
      b.blocker.toString() === req.userId ? b.blocked : b.blocker
    );
    
    filter._id = { $ne: req.userId, $nin: blockedIds };
    
    const users = await User.find(filter)
      .select("displayName bio interests avatar profileVisibility lastSeen isOnline createdAt")
      .limit(50);
    
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// Get user profile by ID
router.get("/:id", protect, async (req, res) => {
  try {
    // Check if blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blocked: req.params.id },
        { blocker: req.params.id, blocked: req.userId }
      ]
    });
    
    if (isBlocked) {
      return res.status(403).json({ error: "Cannot view this profile" });
    }
    
    const user = await User.findById(req.params.id)
      .select("displayName bio interests avatar profileVisibility lastSeen isOnline createdAt");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get circles the user is in (respecting visibility)
    let circles = [];
    if (user.profileVisibility?.showCircles !== false) {
      circles = await Circle.find({
        members: req.params.id,
        visibility: "public"
      }).select("title description members coverImage tags");
    }
    
    // Build response based on visibility settings
    const visibility = user.profileVisibility || {};
    const response = {
      _id: user._id,
      displayName: user.displayName,
      avatar: user.avatar,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
      bio: visibility.showBio !== false ? user.bio : null,
      interests: visibility.showInterests !== false ? user.interests : [],
      circles: visibility.showCircles !== false ? circles : [],
      allowMessages: visibility.allowMessages !== false
    };
    
    // Check if current user has blocked this user
    const hasBlocked = await Block.findOne({
      blocker: req.userId,
      blocked: req.params.id
    });
    response.isBlockedByMe = !!hasBlocked;
    
    res.json(response);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Block a user
router.post("/:id/block", protect, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }
    
    const existingBlock = await Block.findOne({
      blocker: req.userId,
      blocked: req.params.id
    });
    
    if (existingBlock) {
      return res.status(400).json({ error: "User already blocked" });
    }
    
    await Block.create({
      blocker: req.userId,
      blocked: req.params.id,
      reason: req.body.reason
    });
    
    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// Unblock a user
router.post("/:id/unblock", protect, async (req, res) => {
  try {
    await Block.findOneAndDelete({
      blocker: req.userId,
      blocked: req.params.id
    });
    
    res.json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// Get blocked users list
router.get("/blocked/list", protect, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.userId })
      .populate("blocked", "displayName avatar");
    
    res.json(blocks.map(b => ({
      _id: b.blocked._id,
      displayName: b.blocked.displayName,
      avatar: b.blocked.avatar,
      blockedAt: b.createdAt,
      reason: b.reason
    })));
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({ error: "Failed to get blocked users" });
  }
});

export default router;
