import { Router } from "express";
import { MoodEntry } from "../models/MoodEntry.js";
import { protect } from "../middleware/auth.js";
import dayjs from "dayjs";

const router = Router();

router.post("/", protect, async (req, res) => {
  const day = dayjs().format("YYYY-MM-DD");
  const entry = await MoodEntry.findOneAndUpdate(
    { user: req.userId, day },
    { mood: req.body.mood },
    { upsert: true, new: true }
  );
  res.json(entry);
});

router.get("/today", protect, async (req, res) => {
  const day = dayjs().format("YYYY-MM-DD");
  const entry = await MoodEntry.findOne({ user: req.userId, day });
  res.json(entry ?? { mood: "not_added" });
});

// Get recent mood entries (last 7 days for history)
router.get("/", protect, async (req, res) => {
  try {
    const entries = await MoodEntry.find({ user: req.userId })
      .sort({ day: -1 })
      .limit(7);
    res.json(entries);
  } catch (error) {
    console.error("Get mood history error:", error);
    res.status(500).json({ error: "Failed to get mood history" });
  }
});

// Get mood history for a specific month
router.get("/history", protect, async (req, res) => {
  const { year, month } = req.query;
  const startDate = dayjs(`${year}-${month}-01`).startOf('month').format("YYYY-MM-DD");
  const endDate = dayjs(`${year}-${month}-01`).endOf('month').format("YYYY-MM-DD");
  
  const entries = await MoodEntry.find({
    user: req.userId,
    day: { $gte: startDate, $lte: endDate }
  });
  
  // Convert to a map of day -> mood
  const moodMap = {};
  entries.forEach(entry => {
    const dayNum = dayjs(entry.day).date();
    moodMap[dayNum] = entry.mood;
  });
  
  res.json(moodMap);
});

export default router;