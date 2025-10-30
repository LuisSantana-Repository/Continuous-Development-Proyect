import express from "express";
import cors from "cors";
import { router as authRoutes } from "./src/routes/auth.js";
import { router as userRoutes } from "./src/routes/users.js";
import { router as healthRoutes } from "./src/routes/health.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: "Welcome to the API server!",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/auth/*",
      users: "/users/*"
    }
  });
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Error handling (must be last)
app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use(errorHandler);


// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`☁️  S3 Endpoint: ${process.env.AWS_ENDPOINT}`);
  //connsole log root
  console.log(`🌐 API Root: http://localhost:${PORT}/`);
});



