import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validateReview } from "../utils/validators.js";
import {
  createReview,
  getReviewById,
  getProviderReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getProviderRating,
} from "../services/review.js";

const router = express.Router();

/**
 * POST /reviews
 * Create a new review
 * Requires authentication
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.sub; // Get userId from JWT token

    const reviewData = {
      ...req.body,
      userId, // Override userId with authenticated user
    };

    // Validate review data
    const validationError = validateReview(reviewData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create review
    const result = await createReview(reviewData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === "PROVIDER_NOT_FOUND") {
      return res.status(404).json({ error: "provider not found" });
    }
    if (error.message === "SERVICE_REQUEST_NOT_FOUND_OR_INVALID") {
      return res.status(404).json({
        error: "service request not found or does not match user and provider",
      });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "you have already reviewed this service request",
      });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /reviews/:reviewId
 * Get a review by ID
 * Requires authentication
 */
router.get("/:reviewId", authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await getReviewById(reviewId);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    if (error.message === "REVIEW_NOT_FOUND") {
      return res.status(404).json({ error: "review not found" });
    }
    console.error("Error getting review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /reviews/user/:userId
 * Get all reviews by a user with pagination
 * Requires authentication and user must match or be admin
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user.sub;

    // Only allow users to see their own reviews
    if (userId !== authenticatedUserId) {
      return res
        .status(403)
        .json({ error: "you can only view your own reviews" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const result = await getUserReviews(userId, page, pageSize);

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /reviews/provider/:providerId
 * Get all reviews for a provider with pagination
 * Public endpoint (no authentication required)
 */
router.get("/provider/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;

    console.log("GET /reviews/provider/:providerId - Request params:", {
      providerId,
      query: req.query,
    });

    if (isNaN(parseInt(providerId))) {
      console.error("Invalid provider ID:", providerId);
      return res.status(400).json({ error: "invalid provider id" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const minRating = req.query.minRating
      ? parseInt(req.query.minRating)
      : null;

    console.log("Parsed parameters:", {
      providerId: parseInt(providerId),
      page,
      pageSize,
      minRating,
    });

    // Validate minRating if provided
    if (minRating !== null && (minRating < 1 || minRating > 5)) {
      return res
        .status(400)
        .json({ error: "min rating must be between 1 and 5" });
    }

    const result = await getProviderReviews(
      parseInt(providerId),
      page,
      pageSize,
      minRating
    );

    console.log("Response data:", {
      reviewCount: result.reviews.length,
      pagination: result.pagination,
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting provider reviews:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /reviews/provider/:providerId/rating
 * Get average rating for a provider
 * Public endpoint (no authentication required)
 */
router.get("/provider/:providerId/rating", async (req, res) => {
  try {
    const { providerId } = req.params;

    if (isNaN(parseInt(providerId))) {
      return res.status(400).json({ error: "invalid provider id" });
    }

    const result = await getProviderRating(parseInt(providerId));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting provider rating:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * DELETE /reviews/:reviewId
 * Delete a review
 * Requires authentication and user must be the review author
 */
router.delete("/:reviewId", authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.sub;

    // Check if review exists and belongs to user
    const review = await getReviewById(reviewId);
    if (review.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "you can only delete your own reviews" });
    }

    // Delete review
    await deleteReview(reviewId);

    res.json({
      success: true,
      message: "review deleted successfully",
    });
  } catch (error) {
    if (error.message === "REVIEW_NOT_FOUND") {
      return res.status(404).json({ error: "review not found" });
    }
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

export { router };
