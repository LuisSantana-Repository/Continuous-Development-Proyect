import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  validateProviderReport,
  validateReportUpdate,
} from "../utils/validators.js";
import {
  createProviderReport,
  getProviderReportById,
  getProviderReports,
  getClientReports,
  updateProviderReportStatus,
  deleteProviderReport,
  getClientReportStats,
} from "../services/providerReport.js";

const router = express.Router();

/**
 * POST /provider-reports-service
 * Create a new provider report (provider reporting a client)
 * Requires authentication
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: "provider id is required" });
    }

    const reportData = {
      ...req.body,
      providerId: parseInt(providerId),
    };

    // Validate report data
    const validationError = validateProviderReport(reportData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create report
    const result = await createProviderReport(reportData);

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
    console.error("Error creating provider report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reports-service/:reportId
 * Get a provider report by ID
 * Requires authentication
 */
router.get("/:reportId", authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await getProviderReportById(reportId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.message === "REPORT_NOT_FOUND") {
      return res.status(404).json({ error: "report not found" });
    }
    console.error("Error getting provider report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reports-service/provider/:providerId
 * Get all reports created by a provider with pagination
 * Requires authentication (provider should see their own reports)
 */
router.get("/provider/:providerId", authenticate, async (req, res) => {
  try {
    const { providerId } = req.params;

    console.log(
      "GET /provider-reports-service/provider/:providerId - Request params:",
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
 * GET /provider-reports-service/client/:userId
 * Get all reports about a client with pagination
 * Requires authentication (client should see reports about them, or admin)
 */
router.get("/client/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user.sub;

    console.log(
      "GET /provider-reports-service/client/:userId - Request params:",
      {
        userId,
        authenticatedUserId,
        query: req.query,
      }
    );

    // Only allow users to see their own reports (or TODO: admin)
    if (userId !== authenticatedUserId) {
      return res
        .status(403)
        .json({ error: "you can only view reports about yourself" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || null;

    console.log("Parsed parameters:", {
      userId,
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

    const result = await getClientReports(userId, page, pageSize, status);

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
    console.error("Error getting client reports:", error);

    if (error.message === "INVALID_PARAMETERS") {
      return res.status(400).json({ error: "invalid query parameters" });
    }

    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /provider-reports-service/client/:userId/stats
 * Get report statistics for a client
 * Requires authentication
 */
router.get("/client/:userId/stats", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user.sub;

    // Only allow users to see their own stats (or TODO: admin)
    if (userId !== authenticatedUserId) {
      return res
        .status(403)
        .json({ error: "you can only view your own statistics" });
    }

    const result = await getClientReportStats(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting client report stats:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * PATCH /provider-reports-service/:reportId
 * Update a provider report status (admin/moderator function)
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
    const report = await getProviderReportById(reportId);

    // TODO: Add admin/moderator check here
    // For now, we'll allow any authenticated user to update

    // Update report
    await updateProviderReportStatus(reportId, req.body);

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
    console.error("Error updating provider report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * DELETE /provider-reports-service/:reportId
 * Delete a provider report
 * Requires authentication and user must be the report creator or admin
 */
router.delete("/:reportId", authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    // Check if report exists
    const report = await getProviderReportById(reportId);

    // TODO: Add authorization check
    // - Provider who created the report can delete it
    // - Admin can delete any report

    // Delete report
    await deleteProviderReport(reportId);

    res.json({
      success: true,
      message: "report deleted successfully",
    });
  } catch (error) {
    if (error.message === "REPORT_NOT_FOUND") {
      return res.status(404).json({ error: "report not found" });
    }
    console.error("Error deleting provider report:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

export { router };
