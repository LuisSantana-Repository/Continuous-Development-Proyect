import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validateProviderReview } from "../utils/validators.js";
import { getProviderIdFromUser } from "../utils/authHelpers.js";
import {
  createProviderReview,
  getProviderReviewById,
  getUserReceivedReviews,
  getProviderCreatedReviews,
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
    // Get userId from JWT token (already validated by authenticate middleware)
    const userId = req.user.sub;

    // Get providerId from database using userId (secure)
    const providerId = await getProviderIdFromUser(userId);

    const reviewData = {
      ...req.body,
      providerId,
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
    if (error.message === "USER_NOT_PROVIDER") {
      return res.status(403).json({
        error: "Only providers can create reviews",
      });
    }
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "user not found" });
    }
    if (error.message === "SERVICE_REQUEST_NOT_FOUND_OR_INVALID") {
      return res.status(404).json({
        error: "service request not found or does not match provider and user",
      });
    }
    if (error.message === "SERVICE_REQUEST_NOT_COMPLETED") {
      return res.status(400).json({
        error: "cannot create review: service request must be completed first",
      });
    }
    if (error.message === "REVIEW_ALREADY_EXISTS") {
      return res.status(409).json({
        error: "you have already reviewed this service request",
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
 * GET /provider-reviews/my-reviews
 * @deprecated Este endpoint ya no es necesario. Los datos ahora se incluyen
 * directamente en el endpoint /service-requests (getProviderServiceRequests)
 * con el flag has_provider_review.
 *
 * Get all reviews created by the authenticated provider
 * Requires authentication and user must be a provider
 * IMPORTANT: This must come BEFORE /:reviewId to avoid route collision
 */
router.get("/my-reviews", authenticate, async (req, res) => {
  try {
    // Get userId from JWT token (already validated by authenticate middleware)
    const userId = req.user.sub;

    // Get providerId from database using userId (secure)
    const providerId = await getProviderIdFromUser(userId);

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const result = await getProviderCreatedReviews(providerId, page, pageSize);

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
      deprecated: true,
      message:
        "This endpoint is deprecated. Review flags are now included in service requests.",
    });
  } catch (error) {
    if (error.message === "USER_NOT_PROVIDER") {
      return res.status(403).json({
        error: "Only providers can access this resource",
      });
    }

    console.error("Error getting my reviews:", error);

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

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

export { router };
