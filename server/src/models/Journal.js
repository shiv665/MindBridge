import mongoose from "mongoose";
const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: String,
    visibility: { type: String, enum: ["private", "circle", "public"], default: "private" },
    circles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Circle" }]
  },
  { timestamps: true }
);
export const Journal = mongoose.model("Journal", journalSchema);