// hooks/useChat.js
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";

export function useChat() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const typingTimeoutRef = useRef(null);

  // 🧠 1. Initialize socket ONCE (with cookies)
  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      withCredentials: true, // 🔥 send cookies for JWT
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // ✅ Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connection:success", (data) => {
      console.log("Connection success:", data);
    });

    // 💬 Message events
    newSocket.on("message:received", (message) => {
      console.log("📨 Message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("message:sent", (message) => {
      console.log("✅ Message sent:", message);
      setMessages((prev) =>
        prev.map((m) => (m.tempId === message.tempId ? message : m))
      );
    });

    // ✍️ Typing indicators
    newSocket.on("typing:started", () => setIsTyping(true));
    newSocket.on("typing:stopped", () => setIsTyping(false));

    // 👁️ Read receipts
    newSocket.on("messages:read", (data) => {
      console.log("👁️ Messages read:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat_id === data.chatId
            ? {
                ...msg,
                read_by_user: data.isProvider ? msg.read_by_user : true,
                read_by_provider: data.isProvider
                  ? true
                  : msg.read_by_provider,
              }
            : msg
        )
      );
    });

    // 🟢 / 🔴 Online status
    newSocket.on("user:online", (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    });

    newSocket.on("user:offline", (data) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    // ❌ Error handling
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    // 🧹 Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []); // run once

  // 📥 2. Join a chat
  const openChat = useCallback(
    (chatId) => {
      if (!socket || !chatId) return;
      console.log("📥 Joining chat:", chatId);
      setMessages([]);
      setCurrentChatId(chatId);
      socket.emit("chat:join", { chatId });
    },
    [socket]
  );

  // 📤 3. Leave chat
  const closeChat = useCallback(() => {
    if (!socket || !currentChatId) return;
    socket.emit("chat:leave", { chatId: currentChatId });
    setCurrentChatId(null);
    setMessages([]);
  }, [socket, currentChatId]);

  // 💬 4. Send message
  const sendMessage = useCallback(
    (content) => {
      if (!socket || !currentChatId || !content.trim()) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        tempId,
        chat_id: currentChatId,
        content: content.trim(),
        timestamp: Date.now(),
        sending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      socket.emit("message:send", {
        chatId: currentChatId,
        content: content.trim(),
        tempId,
      });
      socket.emit("typing:stop", { chatId: currentChatId });
    },
    [socket, currentChatId]
  );

  // ✍️ 5. Typing start/stop
  const startTyping = useCallback(() => {
    if (!socket || !currentChatId) return;
    socket.emit("typing:start", { chatId: currentChatId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId: currentChatId });
    }, 3000);
  }, [socket, currentChatId]);

  const stopTyping = useCallback(() => {
    if (!socket || !currentChatId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing:stop", { chatId: currentChatId });
  }, [socket, currentChatId]);

  // 👁️ 6. Mark as read
  const markAsRead = useCallback(() => {
    if (!socket || !currentChatId) return;
    socket.emit("messages:read", { chatId: currentChatId });
  }, [socket, currentChatId]);

  return {
    socket,
    isConnected,
    messages,
    currentChatId,
    isTyping,
    onlineUsers,
    openChat,
    closeChat,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
