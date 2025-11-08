import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getChatById, sendMessage, markMessagesAsRead } from "./chat.js";

// Store active connections: userId -> socketId
const activeUsers = new Map();

/**
 * Initialize Socket.IO server
 */
export function initializeWebSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000", "http://localhost:3001"],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Authentication middleware
    io.use((socket, next) => {
        try {
            let token = socket.handshake.auth?.token;

            // 🔹 If no token in auth, try cookies
            if (!token && socket.handshake.headers.cookie) {
                const cookies = cookie.parse(socket.handshake.headers.cookie || "");
                // Adjust "token" to your actual cookie name if different
                token = cookies.token;
            }

            if (!token) {
                console.warn("❌ Socket auth failed: no token in auth or cookies");
                return next(new Error("Authentication error: No token provided"));
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
            });

            socket.userId = payload.sub;
            socket.isProvider = payload.provider || false;

            console.log(`✅ User authenticated via WebSocket: ${socket.userId}`);
            next();
        } catch (error) {
            console.error("Socket authentication error:", error.message);
            next(new Error("Authentication error: Invalid token"));
        }
    });



    io.on("connection", (socket) => {
        const userId = socket.userId;
        const isProvider = socket.isProvider;

        console.log(`User connected: ${userId} (Provider: ${isProvider})`);

        // Store active user
        activeUsers.set(userId, socket.id);

        // Emit online status to user
        socket.emit("connection:success", {
            userId,
            isProvider,
            socketId: socket.id,
        });

        // Broadcast user online status to their chats
        socket.broadcast.emit("user:online", { userId });

        /**
         * Join a specific chat room
         */
        socket.on("chat:join", async (data) => {
            try {
                const { chatId } = data;

                if (!chatId) {
                    socket.emit("error", { message: "Chat ID is required" });
                    return;
                }

                // Verify user has access to this chat
                const chat = await getChatById(chatId);

                if (chat.user_id !== userId && !isProvider) {
                    socket.emit("error", { message: "Access denied to this chat" });
                    return;
                }

                // Join the chat room
                socket.join(chatId);
                console.log(`📥 User ${userId} joined chat: ${chatId}`);

                socket.emit("chat:joined", { chatId });

                // Mark messages as read when joining
                await markMessagesAsRead(chatId, isProvider);

                // Notify others in the chat that messages were read
                socket.to(chatId).emit("messages:read", {
                    chatId,
                    readBy: userId,
                    isProvider,
                });
            } catch (error) {
                console.error("Error joining chat:", error);
                socket.emit("error", {
                    message: error.message === "CHAT_NOT_FOUND"
                        ? "Chat not found"
                        : "Failed to join chat"
                });
            }
        });

        /**
         * Leave a chat room
         */
        socket.on("chat:leave", (data) => {
            const { chatId } = data;
            socket.leave(chatId);
            console.log(`📤 User ${userId} left chat: ${chatId}`);
            socket.emit("chat:left", { chatId });
        });

        /**
         * Send a message
         */
        socket.on("message:send", async (data) => {
            try {
                const { chatId, content } = data;

                if (!chatId || !content) {
                    socket.emit("error", { message: "Chat ID and content are required" });
                    return;
                }

                if (content.trim().length === 0) {
                    socket.emit("error", { message: "Message cannot be empty" });
                    return;
                }

                if (content.length > 5000) {
                    socket.emit("error", { message: "Message too long (max 5000 characters)" });
                    return;
                }

                // Verify access
                const chat = await getChatById(chatId);
                if (chat.user_id !== userId && !isProvider) {
                    socket.emit("error", { message: "Access denied to this chat" });
                    return;
                }

                // Save message to DynamoDB
                const message = await sendMessage(
                    chatId,
                    userId,
                    content.trim(),
                    isProvider
                );

                console.log(`💬 Message sent in chat ${chatId} by ${userId}`);

                // Emit to sender (confirmation)
                socket.emit("message:sent", {
                    ...message,
                    tempId: data.tempId, // For client-side optimistic updates
                });

                // Emit to all other users in the chat room
                socket.to(chatId).emit("message:received", message);

                // Send push notification to offline users (optional)
                const recipientId = isProvider ? chat.user_id : chat.provider_id;
                if (!activeUsers.has(recipientId)) {
                    // TODO: Send push notification
                    console.log(`📱 User ${recipientId} is offline, send push notification`);
                }
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", {
                    message: "Failed to send message",
                    tempId: data.tempId,
                });
            }
        });

        /**
         * Typing indicator
         */
        socket.on("typing:start", async (data) => {
            try {
                const { chatId } = data;

                // Verify access
                const chat = await getChatById(chatId);
                if (chat.user_id !== userId && !isProvider) {
                    return;
                }

                // Broadcast to others in the chat
                socket.to(chatId).emit("typing:started", {
                    chatId,
                    userId,
                    isProvider,
                });
            } catch (error) {
                console.error("Error handling typing start:", error);
            }
        });

        socket.on("typing:stop", async (data) => {
            try {
                const { chatId } = data;

                // Verify access
                const chat = await getChatById(chatId);
                if (chat.user_id !== userId && !isProvider) {
                    return;
                }

                // Broadcast to others in the chat
                socket.to(chatId).emit("typing:stopped", {
                    chatId,
                    userId,
                    isProvider,
                });
            } catch (error) {
                console.error("Error handling typing stop:", error);
            }
        });

        /**
         * Mark messages as read
         */
        socket.on("messages:read", async (data) => {
            try {
                const { chatId } = data;

                // Verify access
                const chat = await getChatById(chatId);
                if (chat.user_id !== userId && !isProvider) {
                    return;
                }

                await markMessagesAsRead(chatId, isProvider);

                // Notify others in the chat
                socket.to(chatId).emit("messages:read", {
                    chatId,
                    readBy: userId,
                    isProvider,
                });
            } catch (error) {
                console.error("Error marking messages as read:", error);
            }
        });

        /**
         * Handle disconnection
         */
        socket.on("disconnect", (reason) => {
            console.log(`🔌 User disconnected: ${userId} (Reason: ${reason})`);

            // Remove from active users
            activeUsers.delete(userId);

            // Broadcast offline status
            socket.broadcast.emit("user:offline", { userId });
        });

        /**
         * Handle errors
         */
        socket.on("error", (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });

    console.log("✅ WebSocket server initialized");

    return io;
}

/**
 * Check if user is online
 */
export function isUserOnline(userId) {
    return activeUsers.has(userId);
}

/**
 * Get active users count
 */
export function getActiveUsersCount() {
    return activeUsers.size;
}

/**
 * Get socket ID for a user
 */
export function getUserSocketId(userId) {
    return activeUsers.get(userId);
}
