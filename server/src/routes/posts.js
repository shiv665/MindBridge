import { Router } from "express";
import { Post } from "../models/Post.js";
import { Circle } from "../models/Circle.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// create post
router.post("/", protect, async (req, res) => {
  const post = await Post.create({ ...req.body, author: req.userId });
  
  // Notify all circle members (except the post author)
  const circle = await Circle.findById(req.body.circle);
  const author = await User.findById(req.userId);
  if (circle) {
    const membersToNotify = circle.members.filter(m => String(m) !== req.userId);
    for (const memberId of membersToNotify) {
      await Notification.create({
        user: memberId,
        type: "new_post",
        message: `${author?.displayName || 'Someone'} posted in "${circle.title}"`,
        meta: { circleId: circle._id, postId: post._id }
      });
    }
  }
  
  res.json(post);
});

// get posts in a circle
router.get("/circle/:circleId", protect, async (req, res) => {
  const posts = await Post.find({ circle: req.params.circleId })
    .sort({ createdAt: -1 })
    .populate("author", "displayName avatar")
    .populate("comments.author", "displayName avatar");
  res.json(posts);
});

// my posts
router.get("/me", protect, async (req, res) => {
  const posts = await Post.find({ author: req.userId })
    .sort({ createdAt: -1 })
    .populate("circle", "title")
    .populate("author", "displayName avatar")
    .populate("comments.author", "displayName avatar");
  res.json(posts);
});

// like
router.post("/:id/like", protect, async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { likes: req.userId } },
    { new: true }
  ).populate("author", "displayName avatar")
   .populate("comments.author", "displayName avatar");
  if (!post) return res.sendStatus(404);
  res.json(post);
});

// unlike
router.post("/:id/unlike", protect, async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $pull: { likes: req.userId } },
    { new: true }
  ).populate("author", "displayName avatar")
   .populate("comments.author", "displayName avatar");
  if (!post) return res.sendStatus(404);
  res.json(post);
});

// edit post (owner only)
router.put("/:id", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.sendStatus(404);
  if (String(post.author) !== req.userId) return res.sendStatus(403);
  
  const { title, body } = req.body;
  if (title !== undefined) post.title = title;
  if (body !== undefined) post.body = body;
  await post.save();
  
  await post.populate("author", "displayName avatar");
  await post.populate("comments.author", "displayName avatar");
  res.json(post);
});

// add comment
router.post("/:id/comments", protect, async (req, res) => {
  const { body } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.sendStatus(404);
  post.comments.push({ author: req.userId, body });
  await post.save();
  await post.populate("author", "displayName avatar");
  await post.populate("comments.author", "displayName avatar");
  
  // Notify post author (if commenter is not the post author)
  if (String(post.author._id) !== req.userId) {
    const commenter = await User.findById(req.userId);
    const circle = await Circle.findById(post.circle);
    await Notification.create({
      user: post.author._id,
      type: "new_comment",
      message: `${commenter?.displayName || 'Someone'} commented on your post${circle ? ` in "${circle.title}"` : ''}`,
      meta: { circleId: post.circle, postId: post._id }
    });
  }
  
  res.json(post);
});

// edit comment (comment author only)
router.put("/:postId/comments/:commentId", protect, async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.sendStatus(404);
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.sendStatus(404);
  if (String(comment.author) !== req.userId) return res.sendStatus(403);
  
  const { body } = req.body;
  if (body !== undefined) comment.body = body;
  await post.save();
  
  await post.populate("author", "displayName avatar");
  await post.populate("comments.author", "displayName avatar");
  res.json(post);
});

// delete comment (comment author, post author, or circle admin)
router.delete("/:postId/comments/:commentId", protect, async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.sendStatus(404);
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.sendStatus(404);
  
  // Check if user is comment author, post author, or circle admin
  const circle = await Circle.findById(post.circle);
  const isCommentAuthor = String(comment.author) === req.userId;
  const isPostAuthor = String(post.author) === req.userId;
  const isCircleAdmin = circle?.admins?.map(String).includes(req.userId);
  
  if (!isCommentAuthor && !isPostAuthor && !isCircleAdmin) {
    return res.sendStatus(403);
  }
  
  comment.deleteOne();
  await post.save();
  await post.populate("author", "displayName avatar");
  await post.populate("comments.author", "displayName avatar");
  res.json(post);
});

// delete post (owner or circle admin)
router.delete("/:id", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.sendStatus(404);
  
  // Check if user is post author or circle admin
  const circle = await Circle.findById(post.circle);
  const isPostAuthor = String(post.author) === req.userId;
  const isCircleAdmin = circle?.admins?.map(String).includes(req.userId);
  
  if (!isPostAuthor && !isCircleAdmin) {
    return res.sendStatus(403);
  }
  
  await post.deleteOne();
  res.json({ ok: true });
});

export default router;