import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./src/routes/router.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { listS3Objects } from "./src/services/s3.js";
import { createServer } from "http";
import { initializeWebSocket } from "./src/services/websocket.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Global Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CORS_ORIGIN || 'https://yourdomain.com']
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the API server!",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/auth/*",
      users: "/users/*",
      services: "/services/*",
      images: "/images/*",
      serviceRequests: "/service-requests/*",
      reviews: "/reviews/*",
      chats: "/chats/*",
      websocket: `ws://localhost:${PORT}`,
    },
  });
});

// API Routes
app.use(routes);

// Error handling
app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use(errorHandler);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);
app.set("io", io);

// Start server (use httpServer, not app)
httpServer.listen(PORT, async () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server running on ws://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.DB_PRIMARY_HOST}:${process.env.DB_PRIMARY_PORT}`);
  console.log(`☁️  S3 Endpoint: ${process.env.AWS_ENDPOINT}`);
  
  try {
    const objects = await listS3Objects("profile/");
    console.log(`📁 S3 Objects found: ${objects.length}`);
  } catch (error) {
    console.error("❌ Error listing S3 objects:", error.message);
  }
});