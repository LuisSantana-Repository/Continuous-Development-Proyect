import { getPrimaryPool } from "../config/database.js";

/**
 * Get provider_id from authenticated user's userId (from JWT token)
 *
 * @param {string} userId - The user's UUID from JWT token (req.user.sub)
 * @returns {Promise<number>} The provider_id from the providers table
 * @throws {Error} 'USER_NOT_PROVIDER' if user is not a provider
 * @throws {Error} Database errors
 */
export async function getProviderIdFromUser(userId) {
  const pool = await getPrimaryPool();
  const connection = await pool.getConnection();
  try {
    const [providers] = await connection.query(
      "SELECT provider_id FROM providers WHERE user_id = ?",
      [userId]
    );

    if (providers.length === 0) {
      throw new Error("USER_NOT_PROVIDER");
    }

    return providers[0].provider_id;
  } finally {
    connection.release();
  }
}

/**
 * Middleware to verify user is a provider and inject providerId into req
 * Usage: router.post("/", authenticate, requireProvider, async (req, res) => {...})
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export async function requireProvider(req, res, next) {
  try {
    const userId = req.user.sub;
    const providerId = await getProviderIdFromUser(userId);

    // Inject providerId into request object for use in route handlers
    req.providerId = providerId;
    next();
  } catch (error) {
    if (error.message === "USER_NOT_PROVIDER") {
      return res.status(403).json({
        error: "Only providers can access this resource",
      });
    }
    console.error("Error in requireProvider middleware:", error);
    res.status(500).json({ error: "Server error" });
  }
}
