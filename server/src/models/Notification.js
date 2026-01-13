import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String,
    message: String,
    read: { type: Boolean, default: false },
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);
export const Notification = mongoose.model("Notification", notificationSchema);