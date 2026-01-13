import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Circle } from "../models/Circle.js";
import { Post } from "../models/Post.js";
import { Journal } from "../models/Journal.js";
import { MoodEntry } from "../models/MoodEntry.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

// Admin password - you can change this
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mindbridge@admin123";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin_secret_key_mindbridge_2024";

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET);
    if (decoded.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Admin login
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ role: "admin" }, ADMIN_SECRET, { expiresIn: "24h" });
  res.json({ token });
});

// Get stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const [users, circles, posts, journals, moods, notifications] = await Promise.all([
      User.countDocuments(),
      Circle.countDocuments(),
      Post.countDocuments(),
      Journal.countDocuments(),
      MoodEntry.countDocuments(),
      Notification.countDocuments(),
    ]);

    res.json({ users, circles, posts, journals, moods, notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all circles
router.get("/circles", verifyAdmin, async (req, res) => {
  try {
    const circles = await Circle.find()
      .populate("members", "displayName email")
      .populate("admins", "displayName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(circles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
router.get("/posts", verifyAdmin, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "displayName email avatar")
      .populate("circle", "title")
      .populate("likes", "displayName")
      .populate("comments.author", "displayName")
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all journals
router.get("/journals", verifyAdmin, async (req, res) => {
  try {
    const journals = await Journal.find()
      .populate("user", "displayName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all mood entries
router.get("/moods", verifyAdmin, async (req, res) => {
  try {
    const moods = await MoodEntry.find()
      .populate("user", "displayName email")
      .sort({ date: -1 })
      .lean();
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all notifications
router.get("/notifications", verifyAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("user", "displayName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
