import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, async (req, res) => {
  const list = await Notification.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(list);
});

router.post("/read/:id", protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ ok: true });
});

export default router;