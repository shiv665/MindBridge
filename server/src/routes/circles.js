import { Router } from "express";
import { Circle } from "../models/Circle.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, async (req, res) => {
  const circle = await Circle.create({
    ...req.body,
    members: [req.userId],
    admins: [req.userId]
  });
  res.json(circle);
});

router.get("/", protect, async (req, res) => {
  const { q, tag } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: String(q), $options: "i" };
  if (tag) filter.tags = String(tag);
  const circles = await Circle.find(filter);
  res.json(circles);
});

// Get recommended circles based on user interests
router.get("/recommendations", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.interests || user.interests.length === 0) {
      // If no interests, return popular public circles user hasn't joined
      const popularCircles = await Circle.find({ 
        visibility: "public",
        members: { $nin: [req.userId] }
      })
        .sort({ createdAt: -1 })
        .limit(6);
      return res.json(popularCircles);
    }

    // Find circles where user is NOT a member (use $nin for array field)
    const recommendedCircles = await Circle.find({
      visibility: "public",
      members: { $nin: [req.userId] }
    });

    // If no circles to recommend, return empty
    if (recommendedCircles.length === 0) {
      return res.json([]);
    }

    // Score and sort circles by matching tags
    const userInterestsLower = user.interests.map(i => i.toLowerCase().trim());
    
    // A circle is recommended if ANY tag matches ANY interest (partial match allowed)
    const scoredCircles = recommendedCircles.map(circle => {
      const circleTags = (circle.tags || []).map(t => t.toLowerCase().trim());
      let score = 0;
      
      // Check each circle tag against each user interest
      for (const tag of circleTags) {
        for (const interest of userInterestsLower) {
          // Exact match gets higher score
          if (tag === interest) {
            score += 3;
          }
          // Partial match (tag contains interest or vice versa)
          else if (tag.includes(interest) || interest.includes(tag)) {
            score += 2;
          }
          // Word similarity (e.g., "mental health" matches "mental")
          else if (tag.split(' ').some(word => interest.split(' ').includes(word))) {
            score += 1;
          }
        }
      }
      
      // Also check circle title and description for interest keywords
      const titleLower = (circle.title || '').toLowerCase();
      const descLower = (circle.description || '').toLowerCase();
      for (const interest of userInterestsLower) {
        if (titleLower.includes(interest)) score += 1;
        if (descLower.includes(interest)) score += 0.5;
      }
      
      return {
        circle,
        score
      };
    });

    // Sort by score (descending) and include circles with score > 0 (at least one match)
    const sortedCircles = scoredCircles
      .filter(sc => sc.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(sc => sc.circle)
      .slice(0, 6);

    // If not enough recommendations, add some popular circles
    if (sortedCircles.length < 3) {
      const existingIds = sortedCircles.map(c => c._id.toString());
      const additionalCircles = await Circle.find({
        visibility: "public",
        _id: { $nin: existingIds.map(id => id) },
        members: { $nin: [req.userId] }
      })
        .sort({ createdAt: -1 })
        .limit(6 - sortedCircles.length);
      sortedCircles.push(...additionalCircles);
    }

    res.json(sortedCircles);
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

router.get("/:id", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id)
    .populate("members", "displayName avatar email")
    .populate("admins", "displayName avatar email")
    .populate("joinRequests", "displayName avatar email");
  if (!circle) return res.sendStatus(404);
  res.json(circle);
});

// Update circle (admin only)
router.put("/:id", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  if (!circle.admins.map(String).includes(req.userId)) return res.sendStatus(403);
  
  const { title, description, visibility, tags, coverImage } = req.body;
  if (title) circle.title = title;
  if (description !== undefined) circle.description = description;
  if (visibility) circle.visibility = visibility;
  if (tags !== undefined) circle.tags = tags;
  if (coverImage !== undefined) circle.coverImage = coverImage;
  
  await circle.save();
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

router.post("/:id/join", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  
  const requestingUser = await User.findById(req.userId);
  
  if (circle.visibility === "public") {
    circle.members.addToSet(req.userId);
  } else {
    // Add to join requests
    circle.joinRequests.addToSet(req.userId);
    
    // Notify all admins about the join request
    for (const adminId of circle.admins) {
      await Notification.create({
        user: adminId,
        type: "Join Request",
        message: `${requestingUser?.displayName || 'Someone'} requested to join "${circle.title}"`,
        meta: {
          circleId: circle._id,
          circleName: circle.title,
          requesterId: req.userId,
          requesterName: requestingUser?.displayName,
          actionType: "join_request"
        }
      });
    }
  }
  await circle.save();
  res.json(circle);
});

// Leave circle
router.post("/:id/leave", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  circle.members.pull(req.userId);
  circle.admins.pull(req.userId);
  await circle.save();
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

// Approve join request (admin only)
router.post("/:id/requests/:userId/approve", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  if (!circle.admins.map(String).includes(req.userId)) return res.sendStatus(403);
  circle.joinRequests.pull(req.params.userId);
  circle.members.addToSet(req.params.userId);
  await circle.save();
  
  // Notify the user that their request was approved
  await Notification.create({
    user: req.params.userId,
    type: "Request Approved",
    message: `Your request to join "${circle.title}" has been approved! You are now a member.`,
    meta: {
      circleId: circle._id,
      circleName: circle.title,
      actionType: "request_approved"
    }
  });
  
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

// Reject join request (admin only)
router.post("/:id/requests/:userId/reject", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  if (!circle.admins.map(String).includes(req.userId)) return res.sendStatus(403);
  circle.joinRequests.pull(req.params.userId);
  await circle.save();
  
  // Notify the user that their request was rejected
  await Notification.create({
    user: req.params.userId,
    type: "Request Declined",
    message: `Your request to join "${circle.title}" was not approved.`,
    meta: {
      circleId: circle._id,
      circleName: circle.title,
      actionType: "request_rejected"
    }
  });
  
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

// Remove member (admin only)
router.post("/:id/members/:userId/remove", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  if (!circle.admins.map(String).includes(req.userId)) return res.sendStatus(403);
  // Can't remove yourself as the last admin
  if (circle.admins.length === 1 && circle.admins.map(String).includes(req.params.userId)) {
    return res.status(400).json({ error: "Cannot remove the last admin" });
  }
  circle.members.pull(req.params.userId);
  circle.admins.pull(req.params.userId);
  await circle.save();
  
  // Notify the removed user
  await Notification.create({
    user: req.params.userId,
    type: "Removed from Circle",
    message: `You have been removed from "${circle.title}".`,
    meta: {
      circleId: circle._id,
      circleName: circle.title,
      actionType: "removed_from_circle"
    }
  });
  
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

// Promote member to admin (admin only)
router.post("/:id/members/:userId/promote", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  if (!circle.admins.map(String).includes(req.userId)) return res.sendStatus(403);
  if (!circle.members.map(String).includes(req.params.userId)) {
    return res.status(400).json({ error: "User is not a member" });
  }
  circle.admins.addToSet(req.params.userId);
  await circle.save();
  
  // Notify the promoted user
  await Notification.create({
    user: req.params.userId,
    type: "Promoted to Admin",
    message: `You are now an admin of "${circle.title}"!`,
    meta: {
      circleId: circle._id,
      circleName: circle.title,
      actionType: "promoted_to_admin"
    }
  });
  
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

// Demote admin to member (admin only)
router.post("/:id/members/:userId/demote", protect, async (req, res) => {
  const circle = await Circle.findById(req.params.id);
  if (!circle) return res.sendStatus(404);
  if (!circle.admins.map(String).includes(req.userId)) return res.sendStatus(403);
  // Can't demote the last admin
  if (circle.admins.length === 1) {
    return res.status(400).json({ error: "Cannot demote the last admin" });
  }
  circle.admins.pull(req.params.userId);
  await circle.save();
  await circle.populate("members", "displayName avatar email");
  await circle.populate("admins", "displayName avatar email");
  await circle.populate("joinRequests", "displayName avatar email");
  res.json(circle);
});

export default router;