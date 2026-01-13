import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    conversationId: { type: String, required: true } // Sorted combination of sender and receiver IDs
  },
  { timestamps: true }
);

// Index for faster conversation queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });

export const Message = mongoose.model("Message", messageSchema);
