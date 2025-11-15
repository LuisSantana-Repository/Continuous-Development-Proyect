import { v4 as uuidv4 } from "uuid";
import { getPrimaryPool } from "../config/database.js";

/**
 * Create a new provider report (provider reporting a client)
 * @param {Object} data - Report data
 * @param {number} data.providerId - Provider ID creating the report
 * @param {string} data.serviceRequestId - Service request ID being reported
 * @param {string} data.reportMessage - Report message
 * @returns {Promise<Object>} Created report ID
 */
export async function createProviderReport(data) {
  const db = await getPrimaryPool();
  const reportId = uuidv4();

  const { providerId, serviceRequestId, reportMessage } = data;

  // Verify service request exists and belongs to the provider
  const [requestRows] = await db.execute(
    `SELECT request_id, provider_id, user_id 
     FROM service_requests 
     WHERE request_id = ? AND provider_id = ?`,
    [serviceRequestId, providerId]
  );

  if (requestRows.length === 0) {
    throw new Error("SERVICE_REQUEST_NOT_FOUND_OR_NOT_YOURS");
  }

  // Insert the report
  await db.execute(
    `INSERT INTO provider_reports 
      (report_id, provider_id, service_request_id, report_message, status) 
     VALUES (?, ?, ?, ?, 'pending')`,
    [reportId, providerId, serviceRequestId, reportMessage]
  );

  return { reportId };
}

/**
 * Get a provider report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Report data
 */
export async function getProviderReportById(reportId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      r.report_id,
      r.provider_id,
      r.service_request_id,
      r.report_message,
      r.status,
      r.created_at,
      r.updated_at,
      sr.user_id,
      u.username,
      u.Foto as user_photo
     FROM provider_reports r
     INNER JOIN service_requests sr ON r.service_request_id = sr.request_id
     INNER JOIN users u ON sr.user_id = u.user_id
     WHERE r.report_id = ?`,
    [reportId]
  );

  if (rows.length === 0) {
    throw new Error("REPORT_NOT_FOUND");
  }

  return rows[0];
}

/**
 * Get reports by provider ID (reports created by a provider) with pagination
 * @param {number} providerId - Provider ID
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Object>} Reports and pagination data
 */
export async function getProviderReports(
  providerId,
  page = 1,
  pageSize = 10,
  status = null
) {
  const db = await getPrimaryPool();

  const safeProviderId = parseInt(providerId);
  const safePage = parseInt(page);
  const safePageSize = parseInt(pageSize);
  const offset = (safePage - 1) * safePageSize;

  console.log("getProviderReports params:", {
    original: { providerId, page, pageSize, status },
    converted: { safeProviderId, safePage, safePageSize, offset },
  });

  if (isNaN(safeProviderId) || isNaN(safePage) || isNaN(safePageSize)) {
    throw new Error("INVALID_PARAMETERS");
  }

  // Build WHERE clause
  let whereClause = "WHERE r.provider_id = ?";
  const countParams = [safeProviderId];
  const queryParams = [safeProviderId];

  if (status !== null && status !== undefined) {
    whereClause += " AND r.status = ?";
    countParams.push(status);
    queryParams.push(status);
  }

  // Get total count
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total 
     FROM provider_reports r
     ${whereClause}`,
    countParams
  );
  const total = countRows[0].total;

  console.log("Total count:", total);

  // Get paginated reports with user info
  const selectQuery = `SELECT 
      r.report_id,
      r.provider_id,
      r.service_request_id,
      r.report_message,
      r.status,
      r.created_at,
      r.updated_at,
      sr.user_id,
      u.username,
      u.Foto as user_photo
     FROM provider_reports r
     INNER JOIN service_requests sr ON r.service_request_id = sr.request_id
     INNER JOIN users u ON sr.user_id = u.user_id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT ${safePageSize} OFFSET ${offset}`;

  console.log("Executing query:", selectQuery);
  console.log("With params:", queryParams);

  const [rows] = await db.query(selectQuery, queryParams);

  const totalPages = Math.ceil(total / safePageSize);

  console.log("Query results:", {
    rowCount: rows.length,
    total,
    totalPages,
  });

  return {
    reports: rows,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
}

/**
 * Get reports about a user (reports targeting a client) with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Object>} Reports and pagination data
 */
export async function getClientReports(
  userId,
  page = 1,
  pageSize = 10,
  status = null
) {
  const db = await getPrimaryPool();

  const safePage = parseInt(page);
  const safePageSize = parseInt(pageSize);
  const offset = (safePage - 1) * safePageSize;

  console.log("getClientReports params:", {
    original: { userId, page, pageSize, status },
    converted: { safePage, safePageSize, offset },
  });

  if (isNaN(safePage) || isNaN(safePageSize)) {
    throw new Error("INVALID_PARAMETERS");
  }

  // Build WHERE clause
  let whereClause = "WHERE sr.user_id = ?";
  const countParams = [userId];
  const queryParams = [userId];

  if (status !== null && status !== undefined) {
    whereClause += " AND r.status = ?";
    countParams.push(status);
    queryParams.push(status);
  }

  // Get total count
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total 
     FROM provider_reports r
     INNER JOIN service_requests sr ON r.service_request_id = sr.request_id
     ${whereClause}`,
    countParams
  );
  const total = countRows[0].total;

  console.log("Total count:", total);

  // Get paginated reports with provider info
  const selectQuery = `SELECT 
      r.report_id,
      r.provider_id,
      r.service_request_id,
      r.report_message,
      r.status,
      r.created_at,
      r.updated_at,
      p.workname as provider_workname,
      u.username as provider_username,
      u.Foto as provider_photo,
      st.type_name as service_type
     FROM provider_reports r
     INNER JOIN service_requests sr ON r.service_request_id = sr.request_id
     INNER JOIN providers p ON r.provider_id = p.provider_id
     INNER JOIN users u ON p.user_id = u.user_id
     LEFT JOIN ServiceType st ON p.Service_Type = st.id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT ${safePageSize} OFFSET ${offset}`;

  console.log("Executing query:", selectQuery);
  console.log("With params:", queryParams);

  const [rows] = await db.query(selectQuery, queryParams);

  const totalPages = Math.ceil(total / safePageSize);

  console.log("Query results:", {
    rowCount: rows.length,
    total,
    totalPages,
  });

  return {
    reports: rows,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
}

/**
 * Update a provider report status (admin/moderator function)
 * @param {string} reportId - Report ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.status] - Status (pending, reviewing, resolved, rejected)
 * @returns {Promise<Object>} Success status
 */
export async function updateProviderReportStatus(reportId, updates) {
  const db = await getPrimaryPool();

  const allowedFields = ["status"];
  const updateFields = [];
  const updateValues = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  if (updateFields.length === 0) {
    throw new Error("NO_VALID_FIELDS_TO_UPDATE");
  }

  updateValues.push(reportId);

  const [result] = await db.execute(
    `UPDATE provider_reports 
     SET ${updateFields.join(", ")}
     WHERE report_id = ?`,
    updateValues
  );

  if (result.affectedRows === 0) {
    throw new Error("REPORT_NOT_FOUND");
  }

  return { success: true };
}

/**
 * Delete a provider report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteProviderReport(reportId) {
  const db = await getPrimaryPool();

  const [result] = await db.execute(
    "DELETE FROM provider_reports WHERE report_id = ?",
    [reportId]
  );

  if (result.affectedRows === 0) {
    throw new Error("REPORT_NOT_FOUND");
  }

  return { success: true };
}

/**
 * Get report statistics for a client
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Report statistics
 */
export async function getClientReportStats(userId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      COUNT(*) as totalReports,
      SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pendingReports,
      SUM(CASE WHEN r.status = 'reviewing' THEN 1 ELSE 0 END) as reviewingReports,
      SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) as resolvedReports,
      SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejectedReports
     FROM provider_reports r
     INNER JOIN service_requests sr ON r.service_request_id = sr.request_id
     WHERE sr.user_id = ?`,
    [userId]
  );

  return {
    userId,
    totalReports: rows[0].totalReports || 0,
    pendingReports: rows[0].pendingReports || 0,
    reviewingReports: rows[0].reviewingReports || 0,
    resolvedReports: rows[0].resolvedReports || 0,
    rejectedReports: rows[0].rejectedReports || 0,
  };
}
