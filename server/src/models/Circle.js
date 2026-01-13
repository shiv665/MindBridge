import mongoose from "mongoose";
const circleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    tags: [String],
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    coverImage: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);
export const Circle = mongoose.model("Circle", circleSchema);