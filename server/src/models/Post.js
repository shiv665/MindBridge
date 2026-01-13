import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true }
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    circle: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    body: String,
    attachmentUrl: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema]
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);