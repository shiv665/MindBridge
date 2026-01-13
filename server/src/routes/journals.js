import { Router } from "express";
import { Journal } from "../models/Journal.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, async (req, res) => {
  const journal = await Journal.create({ ...req.body, user: req.userId });
  res.json(journal);
});

router.get("/", protect, async (req, res) => {
  const mine = await Journal.find({ user: req.userId });
  res.json(mine);
});

export default router;