import express from "express";
import { router as authRoutes } from "./auth.js";
import { router as userRoutes } from "./users.js";
import { router as healthRoutes } from "./health.js";
import { router as serviceRoutes } from "./service.js";
import { router as imageRoutes } from "./images.js";
import { router as serviceRequestRoutes } from "./serviceRequests.js";
import { router as reviewRoutes } from "./reviews.js";
import { router as paymentRoutes } from "./payment.js";

const router = express.Router();

// Health check
router.use("/health", healthRoutes);

// Authentication
router.use("/auth", authRoutes);

// Users
router.use("/users", userRoutes);

// Services
router.use("/services", serviceRoutes);

// Images
router.use("/images", imageRoutes);

// Service Requests
router.use("/service-requests", serviceRequestRoutes);

// Reviews
router.use("/reviews", reviewRoutes);

// Payments
router.use("/payments", paymentRoutes);

export default router;
