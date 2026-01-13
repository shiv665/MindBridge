import { Router } from "express";
import mongoose from "mongoose";
import { Message } from "../models/Message.js";
import { Block } from "../models/Block.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Helper to create conversation ID (sorted user IDs)
const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join("_");
};

// Get all conversations for current user
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    
    // Get all messages where user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    // Get blocked users
    const blocks = await Block.find({
      $or: [{ blocker: req.userId }, { blocked: req.userId }]
    });
    const blockedIds = blocks.map(b => 
      b.blocker.toString() === req.userId ? b.blocked.toString() : b.blocker.toString()
    );

    // Get user details for each conversation
    const conversations = await Promise.all(
      messages.map(async (conv) => {
        const otherUserId = conv._id.split("_").find(id => id !== req.userId);
        
        // Skip blocked conversations
        if (blockedIds.includes(otherUserId)) {
          return null;
        }
        
        const otherUser = await User.findById(otherUserId)
          .select("displayName avatar isOnline lastSeen profileVisibility");
        
        if (!otherUser) return null;
        
        return {
          conversationId: conv._id,
          otherUser: {
            _id: otherUser._id,
            displayName: otherUser.displayName,
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen,
            allowMessages: otherUser.profileVisibility?.allowMessages !== false
          },
          lastMessage: {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            sender: conv.lastMessage.sender,
            read: conv.lastMessage.read
          },
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json(conversations.filter(Boolean));
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

// Get messages in a conversation
router.get("/conversation/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blocked: userId },
        { blocker: userId, blocked: req.userId }
      ]
    });
    
    if (isBlocked) {
      return res.status(403).json({ error: "Cannot view messages with this user" });
    }
    
    const conversationId = getConversationId(req.userId, userId);
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "displayName avatar")
      .populate("receiver", "displayName avatar");
    
    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.userId, read: false },
      { read: true }
    );
    
    res.json(messages.reverse());
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Send a message
router.post("/send/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }
    
    if (userId === req.userId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }
    
    // Check if blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blocked: userId },
        { blocker: userId, blocked: req.userId }
      ]
    });
    
    if (isBlocked) {
      return res.status(403).json({ error: "Cannot send message to this user" });
    }
    
    // Check if receiver allows messages
    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (receiver.profileVisibility?.allowMessages === false) {
      return res.status(403).json({ error: "This user has disabled messages" });
    }
    
    const conversationId = getConversationId(req.userId, userId);
    
    const message = await Message.create({
      sender: req.userId,
      receiver: userId,
      content: content.trim(),
      conversationId
    });
    
    await message.populate("sender", "displayName avatar");
    await message.populate("receiver", "displayName avatar");
    
    // Create notification for receiver
    const sender = await User.findById(req.userId);
    await Notification.create({
      user: userId,
      type: "New Message",
      message: `${sender.displayName} sent you a message`,
      meta: {
        senderId: req.userId,
        senderName: sender.displayName,
        messagePreview: content.substring(0, 50),
        actionType: "new_message"
      }
    });
    
    res.json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get unread message count
router.get("/unread/count", protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// Mark conversation as read
router.post("/conversation/:userId/read", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const conversationId = getConversationId(req.userId, userId);
    
    await Message.updateMany(
      { conversationId, receiver: req.userId, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Delete a message (only sender can delete)
router.delete("/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ error: "Can only delete your own messages" });
    }
    
    await message.deleteOne();
    
    res.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
