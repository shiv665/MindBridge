import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String } // Optional reason for blocking
  },
  { timestamps: true }
);

// Ensure a user can only block another user once
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const Block = mongoose.model("Block", blockSchema);
