import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getOrCreateChat,
  getChatById,
  getUserChats,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
    getProviderChat,
    getProviderName,
} from "../services/chat.js";

export const router = express.Router();

/**
 * POST /chats
 * get existing chat between user and provider
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { providerId } = req.body;
    const userId = req.user.sub;

    if (!providerId) {
      return res.status(400).json({ error: "provider id is required" });
    }

    const chat = await getOrCreateChat(userId, providerId);

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Error creating/getting chat:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /chats
 * Get all chats for the authenticated user
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;
    const chats = await getUserChats(userId);


    for (const chat of chats) {
        console.log("Fetching provider name for chat:", chat.chat_id);
        const providerName = await getProviderName(chat.provider_id);
        console.log("Provider name fetched:", providerName);
        chat.chat_name = providerName;
    }

    const isProvider = req.user.provider || false;
    if (isProvider) {
        const providerChats = await getProviderChat(userId);
        
        for (const chat of providerChats) {
            console.log("Fetching user name for chat:", chat.chat_id);
            const userName = await getUserName(chat.user_id);
            chat.chat_name = userName;
        }
        chats.push(...providerChats);
    }

    // Eliminar información confidencial
    chats.forEach(chat => {
        delete chat.user_id;
        delete chat.provider_id;
    });

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    console.error("Error getting user chats:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /chats/:chatId
 * Get a specific chat by ID
 */
router.get("/:chatId", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.sub;

    const chat = await getChatById(chatId);

    // Verify user has access to this chat
    if (chat.user_id !== userId && !req.user.provider) {
      return res.status(403).json({ error: "forbidden" });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    if (error.message === "CHAT_NOT_FOUND") {
      return res.status(404).json({ error: "chat not found" });
    }
    console.error("Error getting chat:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /chats/:chatId/messages
 * Get messages for a specific chat with pagination
 */
router.get("/:chatId/messages", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.sub;
    const limit = parseInt(req.query.limit) || 50;
    const lastTimestamp = req.query.lastTimestamp ? parseInt(req.query.lastTimestamp) : null;

    // Verify user has access to this chat
    const chat = await getChatById(chatId);
    if (chat.user_id !== userId && !req.user.provider) {
      return res.status(403).json({ error: "forbidden" });
    }

    const result = await getChatMessages(chatId, limit, lastTimestamp);

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        limit,
        lastTimestamp: result.lastTimestamp,
        hasMore: result.lastTimestamp !== null,
      },
    });
  } catch (error) {
    if (error.message === "CHAT_NOT_FOUND") {
      return res.status(404).json({ error: "chat not found" });
    }
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * POST /chats/:chatId/messages
 * Send a message in a chat
 */
router.post("/:chatId/messages", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.sub;
    const isProvider = req.user.provider || false;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "message content is required" });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: "message is too long (max 5000 characters)" });
    }

    // Verify user has access to this chat
    const chat = await getChatById(chatId);
    if (chat.user_id !== userId && !isProvider) {
      return res.status(403).json({ error: "forbidden" });
    }

    const message = await sendMessage(chatId, userId, content.trim(), isProvider);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error.message === "CHAT_NOT_FOUND") {
      return res.status(404).json({ error: "chat not found" });
    }
    console.error("Error sending message:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * PATCH /chats/:chatId/read
 * Mark messages as read
 */
router.patch("/:chatId/read", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.sub;
    const isProvider = req.user.provider || false;

    // Verify user has access to this chat
    const chat = await getChatById(chatId);
    if (chat.user_id !== userId && !isProvider) {
      return res.status(403).json({ error: "forbidden" });
    }

    await markMessagesAsRead(chatId, isProvider);

    res.json({
      success: true,
      message: "messages marked as read",
    });
  } catch (error) {
    if (error.message === "CHAT_NOT_FOUND") {
      return res.status(404).json({ error: "chat not found" });
    }
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "server error" });
  }
});