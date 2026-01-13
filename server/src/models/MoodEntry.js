import mongoose from "mongoose";
const moodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true }, // yyyy-mm-dd
    mood: { type: String, enum: ["good", "neutral", "bad", "not_added"], required: true }
  },
  { timestamps: true }
);

// Ensure only one mood entry per user per day (unique compound index)
moodSchema.index({ user: 1, day: 1 }, { unique: true });

export const MoodEntry = mongoose.model("MoodEntry", moodSchema);