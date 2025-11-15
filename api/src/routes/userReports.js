import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  validateUserReport,
  validateReportUpdate,
} from "../utils/validators.js";
import {
  createUserReport,
  getUserReportById,
  getUserReports,
  getProviderReports,
  updateUserReportStatus,
  deleteUserReport,
  getProviderReportStats,
} from "../services/userReport.js";

const router = express.Router();

/**
 * POST /user-reports
 * Create a new user report (client reporting a provider)
 * Requires authentication
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.sub; // Get userId from JWT token

    const reportData = {
      ...req.body,
      userId, // Override userId with authenticated user
    };

    // Validate report data
    const validationError = validateUserReport(reportData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create report
    const result = await createUserReport(reportData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === "SERVICE_REQUEST_NOT_FOUND_OR_NOT_YOURS") {
      return res.status(404).json({
        error: "service request not found or does not belong to you",
      });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "you have already reported this service request",
      });
    }
    console.error("Error creating user report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /user-reports/:reportId
 * Get a user report by ID
 * Requires authentication
 */
router.get("/:reportId", authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await getUserReportById(reportId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.message === "REPORT_NOT_FOUND") {
      return res.status(404).json({ error: "report not found" });
    }
    console.error("Error getting user report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /user-reports/user/:userId
 * Get all reports created by a user with pagination
 * Requires authentication and user must match or be admin
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user.sub;

    // Only allow users to see their own reports
    if (userId !== authenticatedUserId) {
      return res
        .status(403)
        .json({ error: "you can only view your own reports" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || null;

    // Validate status if provided
    if (status !== null) {
      const validStatuses = ["pending", "reviewing", "resolved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "invalid status value" });
      }
    }

    const result = await getUserReports(userId, page, pageSize, status);

    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting user reports:", error);

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /user-reports/provider/:providerId
 * Get all reports about a provider with pagination
 * Requires authentication (provider or admin should see this)
 */
router.get("/provider/:providerId", authenticate, async (req, res) => {
  try {
    const { providerId } = req.params;

    console.log("GET /user-reports/provider/:providerId - Request params:", {
      providerId,
      query: req.query,
    });

    if (isNaN(parseInt(providerId))) {
      console.error("Invalid provider ID:", providerId);
      return res.status(400).json({ error: "invalid provider id" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || null;

    console.log("Parsed parameters:", {
      providerId: parseInt(providerId),
      page,
      pageSize,
      status,
    });

    // Validate status if provided
    if (status !== null) {
      const validStatuses = ["pending", "reviewing", "resolved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "invalid status value" });
      }
    }

    const result = await getProviderReports(
      parseInt(providerId),
      page,
      pageSize,
      status
    );

    console.log("Response data:", {
      reportCount: result.reports.length,
      pagination: result.pagination,
    });

    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting provider reports:", error);

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /user-reports/provider/:providerId/stats
 * Get report statistics for a provider
 * Requires authentication
 */
router.get("/provider/:providerId/stats", authenticate, async (req, res) => {
  try {
    const { providerId } = req.params;

    if (isNaN(parseInt(providerId))) {
      return res.status(400).json({ error: "invalid provider id" });
    }

    const result = await getProviderReportStats(parseInt(providerId));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting provider report stats:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * PATCH /user-reports/:reportId
 * Update a user report status (admin/moderator function)
 * Requires authentication
 */
router.patch("/:reportId", authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    // Validate update data
    const validationError = validateReportUpdate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check if report exists
    const report = await getUserReportById(reportId);

    // TODO: Add admin/moderator check here
    // For now, we'll allow any authenticated user to update

    // Update report
    await updateUserReportStatus(reportId, req.body);

    res.json({
      success: true,
      message: "report status updated successfully",
    });
  } catch (error) {
    if (error.message === "REPORT_NOT_FOUND") {
      return res.status(404).json({ error: "report not found" });
    }
    if (error.message === "NO_VALID_FIELDS_TO_UPDATE") {
      return res.status(400).json({ error: "no valid fields to update" });
    }
    console.error("Error updating user report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * DELETE /user-reports/:reportId
 * Delete a user report
 * Requires authentication and user must be the report creator or admin
 */
router.delete("/:reportId", authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.sub;

    // Check if report exists and belongs to user
    const report = await getUserReportById(reportId);

    // TODO: Add admin check - admins should be able to delete any report
    if (report.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "you can only delete your own reports" });
    }

    // Delete report
    await deleteUserReport(reportId);

    res.json({
      success: true,
      message: "report deleted successfully",
    });
  } catch (error) {
    if (error.message === "REPORT_NOT_FOUND") {
      return res.status(404).json({ error: "report not found" });
    }
    console.error("Error deleting user report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

export { router };
