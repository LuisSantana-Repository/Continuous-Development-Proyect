import express from "express";
import { router as authRoutes } from "./auth.js";
import { router as userRoutes } from "./users.js";
import { router as healthRoutes } from "./health.js";
import { router as serviceRoutes } from "./service.js";
import { router as imageRoutes } from "./images.js";
import { router as serviceRequestRoutes } from "./serviceRequests.js";
import { router as reviewRoutes } from "./reviews.js";
import { router as providerReviewRoutes } from "./providerReviews.js";
import { router as userReportRoutes } from "./userReports.js";
import { router as providerReportRoutes } from "./providerReportRoutes.js";
import { router as providerRoutes } from "./providers.js";
import { router as paymentRoutes } from "./payment.js";
import { router as chatRoutes } from "./chat.js";

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

// Reviews (user reviews of providers)
router.use("/reviews", reviewRoutes);

// Provider Reviews (provider reviews of clients)
router.use("/provider-reviews", providerReviewRoutes);

// User Reports (client reports of providers)
router.use("/user-reports", userReportRoutes);

// Provider Reports (provider reports of clients)
router.use("/provider-reports-service", providerReportRoutes);

// Providers
router.use("/providers", providerRoutes);

// Payments
router.use("/payments", paymentRoutes);

// Chats
router.use("/chats", chatRoutes);

export default router;
