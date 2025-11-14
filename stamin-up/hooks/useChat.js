"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Hook personalizado para manejo de chat en tiempo real
 * @param {string} userId - ID del usuario actual (opcional, se obtendrá si no se proporciona)
 */
export function useChat(userId = null) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(userId);

  const typingTimeoutRef = useRef(null);

  // Obtener el ID del usuario actual si no se proporciona
  useEffect(() => {
    if (!currentUserId) {
      const fetchUserId = async () => {
        try {
          const response = await fetch("http://localhost:3000/users/me", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCurrentUserId(data.user.user_id);
          }
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      };
      fetchUserId();
    }
  }, [currentUserId]);

  // Initialize socket ONCE
  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("connection:success", (data) => {
      console.log("✅ Connection success:", data);
    });

    // Chat events
    newSocket.on("chat:joined", (data) => {
      console.log("✅ Successfully joined chat:", data.chatId);
    });

    // Message events
    newSocket.on("message:received", (message) => {
      console.log("📨 Message received:", message);
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((m) => m.message_id === message.message_id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    newSocket.on("message:sent", (data) => {
      console.log("✅ Message sent confirmation:", data);
      setMessages((prev) =>
        prev.map((m) => {
          // Replace the temp message with the confirmed one
          if (m.tempId === data.tempId) {
            return {
              ...data,
              sending: false,
            };
          }
          return m;
        })
      );
    });

    // Typing indicators
    newSocket.on("typing:started", (data) => {
      console.log("✍️ User started typing:", data);
      setIsTyping(true);
    });

    newSocket.on("typing:stopped", (data) => {
      console.log("✍️ User stopped typing:", data);
      setIsTyping(false);
    });

    // Read receipts
    newSocket.on("messages:read", (data) => {
      console.log("👁️ Messages read:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat_id === data.chatId
            ? {
                ...msg,
                read_by_user: data.isProvider ? msg.read_by_user : true,
                read_by_provider: data.isProvider ? true : msg.read_by_provider,
              }
            : msg
        )
      );
    });

    // Online status
    newSocket.on("user:online", (data) => {
      console.log("🟢 User online:", data.userId);
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    });

    newSocket.on("user:offline", (data) => {
      console.log("🔴 User offline:", data.userId);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    // Error handling
    newSocket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      // Remove failed message
      if (error.tempId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === error.tempId
              ? { ...m, sending: false, error: true }
              : m
          )
        );
      }
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, []);

  // Join a chat
  const openChat = useCallback(
    async (chatId) => {
      if (!socket || !chatId) {
        console.warn("Cannot open chat: socket or chatId missing");
        return;
      }

      console.log("📥 Joining chat:", chatId);
      setMessages([]);
      setCurrentChatId(chatId);

      // Emit join event
      socket.emit("chat:join", { chatId });

      // Fetch existing messages from API
      try {
        const response = await fetch(
          `http://localhost:3000/chats/${chatId}/messages?limit=50`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📜 Loaded messages:", data.data.length);
          setMessages(data.data.reverse() || []); // Reverse to show oldest first
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    },
    [socket]
  );

  // Leave chat
  const closeChat = useCallback(() => {
    if (!socket || !currentChatId) return;
    console.log("📤 Leaving chat:", currentChatId);
    socket.emit("chat:leave", { chatId: currentChatId });
    setCurrentChatId(null);
    setMessages([]);
  }, [socket, currentChatId]);

  // Send message
  const sendMessage = useCallback(
    (content) => {
      if (!socket || !currentChatId || !content.trim()) {
        console.warn("Cannot send message: missing socket, chatId, or content");
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Create optimistic message
      const optimisticMessage = {
        tempId,
        message_id: tempId,
        chat_id: currentChatId,
        sender_id: currentUserId, // ✅ Agregar sender_id del usuario actual
        content: content.trim(),
        timestamp: Date.now(),
        sending: true,
      };

      console.log("📤 Sending message:", optimisticMessage);

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Emit to server
      socket.emit("message:send", {
        chatId: currentChatId,
        content: content.trim(),
        tempId,
      });

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("typing:stop", { chatId: currentChatId });
    },
    [socket, currentChatId, currentUserId]
  );

  // Typing start/stop
  const startTyping = useCallback(() => {
    if (!socket || !currentChatId) return;
    socket.emit("typing:start", { chatId: currentChatId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId: currentChatId });
    }, 3000);
  }, [socket, currentChatId]);

  const stopTyping = useCallback(() => {
    if (!socket || !currentChatId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit("typing:stop", { chatId: currentChatId });
  }, [socket, currentChatId]);

  // Mark as read
  const markAsRead = useCallback(() => {
    if (!socket || !currentChatId) return;
    socket.emit("messages:read", { chatId: currentChatId });
  }, [socket, currentChatId]);

  return {
    socket,
    isConnected,
    messages,
    currentChatId,
    currentUserId, // ✅ Exportar el ID del usuario actual
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
