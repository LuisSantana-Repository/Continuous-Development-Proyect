import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./src/routes/router.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { listS3Objects } from "./src/services/s3.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Permite ambos puertos
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
    },
  });
});

// API Routes (centralized router)
app.use(routes);

// Error handling (must be last)
app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use(errorHandler);

const objects = await listS3Objects("profile/");

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`☁️  S3 Endpoint: ${process.env.AWS_ENDPOINT}`);
  //connsole log root
  console.log(`🌐 API Root: http://localhost:${PORT}/`);
  console.log(objects);
});
