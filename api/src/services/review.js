import { v4 as uuidv4 } from "uuid";
import { getPrimaryPool } from "../config/database.js";

/**
 * Create a new review
 * @param {Object} data - Review data
 * @param {string} data.userId - User ID creating the review
 * @param {number} data.providerId - Provider being reviewed
 * @param {string} [data.serviceRequestId] - Optional service request ID
 * @param {number} data.rating - Rating (1-5)
 * @param {string} [data.comment] - Optional comment
 * @returns {Promise<Object>} Created review ID
 */
export async function createReview(data) {
  const db = await getPrimaryPool();
  const reviewId = uuidv4();

  const {
    userId,
    providerId,
    serviceRequestId = null,
    rating,
    comment = null,
  } = data;

  // Verify provider exists
  const [providerRows] = await db.execute(
    "SELECT provider_id FROM providers WHERE provider_id = ?",
    [providerId]
  );

  if (providerRows.length === 0) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  // If serviceRequestId is provided, verify it exists and belongs to the user
  if (serviceRequestId) {
    const [requestRows] = await db.execute(
      "SELECT request_id FROM service_requests WHERE request_id = ? AND user_id = ? AND provider_id = ?",
      [serviceRequestId, userId, providerId]
    );

    if (requestRows.length === 0) {
      throw new Error("SERVICE_REQUEST_NOT_FOUND_OR_INVALID");
    }
  }

  const [result] = await db.execute(
    `INSERT INTO user_reviews 
      (review_id, user_id, provider_id, service_request_id, rating, comment) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [reviewId, userId, providerId, serviceRequestId, rating, comment]
  );

  return { reviewId };
}

/**
 * Get a review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Review data
 */
export async function getReviewById(reviewId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      review_id,
      user_id,
      provider_id,
      service_request_id,
      rating,
      comment,
      created_at,
      updated_at
     FROM user_reviews 
     WHERE review_id = ?`,
    [reviewId]
  );

  if (rows.length === 0) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  return rows[0];
}

/**
 * Get reviews by provider ID with pagination
 * @param {number} providerId - Provider ID
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {number} [minRating] - Optional minimum rating filter
 * @returns {Promise<Object>} Reviews and pagination data
 */
export async function getProviderReviews(
  providerId,
  page = 1,
  pageSize = 10,
  minRating = null
) {
  const db = await getPrimaryPool();

  // Asegurar que todos los parámetros sean del tipo correcto
  const safeProviderId = parseInt(providerId);
  const safePage = parseInt(page);
  const safePageSize = parseInt(pageSize);
  const offset = (safePage - 1) * safePageSize;

  console.log("getProviderReviews params:", {
    original: { providerId, page, pageSize, minRating },
    converted: { safeProviderId, safePage, safePageSize, offset },
  });

  // Validar que los valores convertidos sean válidos
  if (isNaN(safeProviderId) || isNaN(safePage) || isNaN(safePageSize)) {
    throw new Error("INVALID_PARAMETERS");
  }

  // Construir WHERE clause
  let whereClause = "WHERE r.provider_id = ?";
  const countParams = [safeProviderId];
  const queryParams = [safeProviderId];

  if (minRating !== null && minRating !== undefined) {
    const safeMinRating = parseInt(minRating);
    if (!isNaN(safeMinRating)) {
      whereClause += " AND r.rating >= ?";
      countParams.push(safeMinRating);
      queryParams.push(safeMinRating);
    }
  }

  // Get total count - con JOIN para consistencia
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total 
     FROM user_reviews r
     INNER JOIN users u ON r.user_id = u.user_id
     ${whereClause}`,
    countParams
  );
  const total = countRows[0].total;

  console.log("Total count:", total);

  // SOLUCIÓN: Usar query en lugar de execute para LIMIT/OFFSET
  // Esto evita problemas con prepared statements en algunas versiones de MySQL
  // Agregamos JOIN con users para obtener username
  const selectQuery = `SELECT 
      r.review_id,
      r.user_id,
      r.provider_id,
      r.service_request_id,
      r.rating,
      r.comment,
      r.created_at,
      r.updated_at,
      u.username,
      u.Foto as user_photo
     FROM user_reviews r
     INNER JOIN users u ON r.user_id = u.user_id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT ${safePageSize} OFFSET ${offset}`;

  console.log("Executing query:", selectQuery);
  console.log("With params:", queryParams);

  // Usar query en lugar de execute
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
 * Get reviews by user ID with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Promise<Object>} Reviews and pagination data
 */
export async function getUserReviews(userId, page = 1, pageSize = 10) {
  const db = await getPrimaryPool();

  // Asegurar que page y pageSize sean enteros
  const safePage = parseInt(page);
  const safePageSize = parseInt(pageSize);
  const offset = (safePage - 1) * safePageSize;

  // Get total count
  const [countRows] = await db.execute(
    "SELECT COUNT(*) as total FROM user_reviews WHERE user_id = ?",
    [userId]
  );
  const total = countRows[0].total;

  // Get paginated reviews - INCLUIR JOIN con providers, users y ServiceType
  const selectQuery = `SELECT 
      r.review_id,
      r.user_id,
      r.provider_id,
      r.service_request_id,
      r.rating,
      r.comment,
      r.created_at,
      r.updated_at,
      p.workname as provider_workname,
      u.username as provider_username,
      st.type_name as service_type
     FROM user_reviews r
     INNER JOIN providers p ON r.provider_id = p.provider_id
     INNER JOIN users u ON p.user_id = u.user_id
     LEFT JOIN ServiceType st ON p.Service_Type = st.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT ${safePageSize} OFFSET ${offset}`;

  const [rows] = await db.query(selectQuery, [userId]);

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
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Fields to update
 * @param {number} [updates.rating] - Rating (1-5)
 * @param {string} [updates.comment] - Comment
 * @returns {Promise<Object>} Success status
 */
export async function updateReview(reviewId, updates) {
  const db = await getPrimaryPool();

  const allowedFields = ["rating", "comment"];
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

  updateValues.push(reviewId);

  const [result] = await db.execute(
    `UPDATE user_reviews 
     SET ${updateFields.join(", ")}
     WHERE review_id = ?`,
    updateValues
  );

  if (result.affectedRows === 0) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  return { success: true };
}

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteReview(reviewId) {
  const db = await getPrimaryPool();

  const [result] = await db.execute(
    "DELETE FROM user_reviews WHERE review_id = ?",
    [reviewId]
  );

  if (result.affectedRows === 0) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  return { success: true };
}

/**
 * Get provider average rating
 * @param {number} providerId - Provider ID
 * @returns {Promise<Object>} Average rating and review count
 */
export async function getProviderRating(providerId) {
  const db = await getPrimaryPool();

  const [rows] = await db.execute(
    `SELECT 
      COALESCE(AVG(rating), 0) as averageRating,
      COUNT(*) as totalReviews
     FROM user_reviews 
     WHERE provider_id = ?`,
    [providerId]
  );

  // Convertir averageRating a número (puede ser Decimal de MySQL)
  const avgRating = parseFloat(rows[0].averageRating) || 0;

  return {
    providerId,
    averageRating: parseFloat(avgRating.toFixed(2)),
    totalReviews: rows[0].totalReviews,
  };
}
