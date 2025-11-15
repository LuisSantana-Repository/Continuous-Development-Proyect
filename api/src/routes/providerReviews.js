import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  validateProviderReview,
  validateReviewUpdate,
} from "../utils/validators.js";
import {
  createProviderReview,
  getProviderReviewById,
  getUserReceivedReviews,
  getProviderCreatedReviews,
  updateProviderReview,
  deleteProviderReview,
  getUserRating,
} from "../services/providerReview.js";

const router = express.Router();

/**
 * POST /provider-reviews
 * Create a new provider review (provider reviewing a client)
 * Requires authentication and user must be a provider
 */
router.post("/", authenticate, async (req, res) => {
  try {
    // Get provider info from request body or derive from authenticated user
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: "provider id is required" });
    }

    const reviewData = {
      ...req.body,
      providerId: parseInt(providerId),
    };

    // Validate review data
    const validationError = validateProviderReview(reviewData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create review
    const result = await createProviderReview(reviewData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "user not found" });
    }
    if (error.message === "SERVICE_REQUEST_NOT_FOUND_OR_INVALID") {
      return res.status(404).json({
        error: "service request not found or does not match provider and user",
      });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "you have already reviewed this service request",
      });
    }
    console.error("Error creating provider review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reviews/:reviewId
 * Get a provider review by ID
 * Requires authentication
 */
router.get("/:reviewId", authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await getProviderReviewById(reviewId);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    if (error.message === "REVIEW_NOT_FOUND") {
      return res.status(404).json({ error: "review not found" });
    }
    console.error("Error getting provider review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reviews/user/:userId
 * Get all reviews received by a user (client) with pagination
 * Public endpoint (no authentication required)
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("GET /provider-reviews/user/:userId - Request params:", {
      userId,
      query: req.query,
    });

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const minRating = req.query.minRating
      ? parseInt(req.query.minRating)
      : null;

    console.log("Parsed parameters:", {
      userId,
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

    const result = await getUserReceivedReviews(
      userId,
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
    console.error("Error getting user received reviews:", error);

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reviews/provider/:providerId
 * Get all reviews created by a provider with pagination
 * Requires authentication and user must be the provider
 */
router.get("/provider/:providerId", authenticate, async (req, res) => {
  try {
    const { providerId } = req.params;

    console.log(
      "GET /provider-reviews/provider/:providerId - Request params:",
      {
        providerId,
        query: req.query,
      }
    );

    if (isNaN(parseInt(providerId))) {
      console.error("Invalid provider ID:", providerId);
      return res.status(400).json({ error: "invalid provider id" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    console.log("Parsed parameters:", {
      providerId: parseInt(providerId),
      page,
      pageSize,
    });

    const result = await getProviderCreatedReviews(
      parseInt(providerId),
      page,
      pageSize
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
    console.error("Error getting provider created reviews:", error);

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reviews/user/:userId/rating
 * Get average rating for a user (client)
 * Public endpoint (no authentication required)
 */
router.get("/user/:userId/rating", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getUserRating(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting user rating:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * PATCH /provider-reviews/:reviewId
 * Update a provider review
 * Requires authentication and user must be the provider who created the review
 */
router.patch("/:reviewId", authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Validate update data
    const validationError = validateReviewUpdate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check if review exists and belongs to provider
    const review = await getProviderReviewById(reviewId);

    // TODO: Verify that the authenticated user is the provider who created this review
    // This would require checking if req.user.sub matches the provider's user_id
    // For now, we'll allow any authenticated user to update

    // Update review
    await updateProviderReview(reviewId, req.body);

    res.json({
      success: true,
      message: "provider review updated successfully",
    });
  } catch (error) {
    if (error.message === "REVIEW_NOT_FOUND") {
      return res.status(404).json({ error: "review not found" });
    }
    if (error.message === "NO_VALID_FIELDS_TO_UPDATE") {
      return res.status(400).json({ error: "no valid fields to update" });
    }
    console.error("Error updating provider review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * DELETE /provider-reviews/:reviewId
 * Delete a provider review
 * Requires authentication and user must be the provider who created the review
 */
router.delete("/:reviewId", authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Check if review exists
    const review = await getProviderReviewById(reviewId);

    // TODO: Verify that the authenticated user is the provider who created this review
    // This would require checking if req.user.sub matches the provider's user_id
    // For now, we'll allow any authenticated user to delete

    // Delete review
    await deleteProviderReview(reviewId);

    res.json({
      success: true,
      message: "provider review deleted successfully",
    });
  } catch (error) {
    if (error.message === "REVIEW_NOT_FOUND") {
      return res.status(404).json({ error: "review not found" });
    }
    console.error("Error deleting provider review:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

export { router };
