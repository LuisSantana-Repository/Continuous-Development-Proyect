import { v4 as uuidv4 } from "uuid";
import { getPrimaryPool } from "../config/database.js";

/**
 * Create a new provider review (provider reviewing a client)
 * @param {Object} data - Review data
 * @param {number} data.providerId - Provider ID creating the review
 * @param {string} data.userId - User ID being reviewed
 * @param {string} [data.serviceRequestId] - Optional service request ID
 * @param {number} data.rating - Rating (1-5)
 * @param {string} [data.comment] - Optional comment
 * @returns {Promise<Object>} Created review ID
 */
export async function createProviderReview(data) {
  const db = await getPrimaryPool();
  const reviewId = uuidv4();

  const {
    providerId,
    userId,
    serviceRequestId = null,
    rating,
    comment = null,
  } = data;

  // Verify user exists
  const [userRows] = await db.execute(
    "SELECT user_id FROM users WHERE user_id = ?",
    [userId]
  );

  if (userRows.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  // If serviceRequestId is provided, verify it exists and belongs to the provider and user
  if (serviceRequestId) {
    const [requestRows] = await db.execute(
      "SELECT request_id, status FROM service_requests WHERE request_id = ? AND user_id = ? AND provider_id = ?",
      [serviceRequestId, userId, providerId]
    );

    if (requestRows.length === 0) {
      throw new Error("SERVICE_REQUEST_NOT_FOUND_OR_INVALID");
    }

    // Verify the service request is completed
    if (requestRows[0].status !== "completed") {
      throw new Error("SERVICE_REQUEST_NOT_COMPLETED");
    }

    // Check if review already exists for this service request
    const [existingReview] = await db.execute(
      "SELECT review_id FROM provider_reviews WHERE service_request_id = ? AND provider_id = ?",
      [serviceRequestId, providerId]
    );

    if (existingReview.length > 0) {
      throw new Error("REVIEW_ALREADY_EXISTS");
    }
  }

  await db.execute(
    `INSERT INTO provider_reviews 
      (review_id, provider_id, user_id, service_request_id, rating, comment) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [reviewId, providerId, userId, serviceRequestId, rating, comment]
  );

  return { reviewId };
}

/**
 * Get a provider review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Review data
 */
export async function getProviderReviewById(reviewId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      review_id,
      provider_id,
      user_id,
      service_request_id,
      rating,
      comment,
      created_at,
      updated_at
     FROM provider_reviews 
     WHERE review_id = ?`,
    [reviewId]
  );

  if (rows.length === 0) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  return rows[0];
}

/**
 * Get reviews by user ID (reviews received by a client) with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {number} [minRating] - Optional minimum rating filter
 * @returns {Promise<Object>} Reviews and pagination data
 */
export async function getUserReceivedReviews(
  userId,
  page = 1,
  pageSize = 10,
  minRating = null
) {
  const db = await getPrimaryPool();

  const safePage = parseInt(page);
  const safePageSize = parseInt(pageSize);
  const offset = (safePage - 1) * safePageSize;

  console.log("getUserReceivedReviews params:", {
    original: { userId, page, pageSize, minRating },
    converted: { safePage, safePageSize, offset },
  });

  if (isNaN(safePage) || isNaN(safePageSize)) {
    throw new Error("INVALID_PARAMETERS");
  }

  // Build WHERE clause
  let whereClause = "WHERE r.user_id = ?";
  const countParams = [userId];
  const queryParams = [userId];

  if (minRating !== null && minRating !== undefined) {
    const safeMinRating = parseInt(minRating);
    if (!isNaN(safeMinRating)) {
      whereClause += " AND r.rating >= ?";
      countParams.push(safeMinRating);
      queryParams.push(safeMinRating);
    }
  }

  // Get total count with JOIN
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total 
     FROM provider_reviews r
     INNER JOIN providers p ON r.provider_id = p.provider_id
     ${whereClause}`,
    countParams
  );
  const total = countRows[0].total;

  console.log("Total count:", total);

  // Get paginated reviews with provider info
  const selectQuery = `SELECT 
      r.review_id,
      r.provider_id,
      r.user_id,
      r.service_request_id,
      r.rating,
      r.comment,
      r.created_at,
      r.updated_at,
      p.workname as provider_workname,
      u.username as provider_username,
      u.Foto as provider_photo,
      st.type_name as service_type
     FROM provider_reviews r
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
    reviews: rows,
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
 * Get reviews by provider ID (reviews created by a provider) with pagination
 * @param {number} providerId - Provider ID
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Promise<Object>} Reviews and pagination data
 */
export async function getProviderCreatedReviews(
  providerId,
  page = 1,
  pageSize = 10
) {
  const db = await getPrimaryPool();

  const safeProviderId = parseInt(providerId);
  const safePage = parseInt(page);
  const safePageSize = parseInt(pageSize);
  const offset = (safePage - 1) * safePageSize;

  if (isNaN(safeProviderId) || isNaN(safePage) || isNaN(safePageSize)) {
    throw new Error("INVALID_PARAMETERS");
  }

  // Get total count
  const [countRows] = await db.execute(
    "SELECT COUNT(*) as total FROM provider_reviews WHERE provider_id = ?",
    [safeProviderId]
  );
  const total = countRows[0].total;

  // Get paginated reviews with user info
  const selectQuery = `SELECT 
      r.review_id,
      r.provider_id,
      r.user_id,
      r.service_request_id,
      r.rating,
      r.comment,
      r.created_at,
      r.updated_at,
      u.username,
      u.Foto as user_photo
     FROM provider_reviews r
     INNER JOIN users u ON r.user_id = u.user_id
     WHERE r.provider_id = ?
     ORDER BY r.created_at DESC
     LIMIT ${safePageSize} OFFSET ${offset}`;

  const [rows] = await db.query(selectQuery, [safeProviderId]);

  const totalPages = Math.ceil(total / safePageSize);

  return {
    reviews: rows,
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
 * Get user average rating (reviews received by a client)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Average rating and review count
 */
export async function getUserRating(userId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      COALESCE(AVG(rating), 0) as averageRating,
      COUNT(*) as totalReviews
     FROM provider_reviews 
     WHERE user_id = ?`,
    [userId]
  );

  const avgRating = parseFloat(rows[0].averageRating) || 0;

  return {
    userId,
    averageRating: parseFloat(avgRating.toFixed(2)),
    totalReviews: rows[0].totalReviews,
  };
}
