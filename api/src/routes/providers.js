import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getProviderByUserId } from "../services/provider.js";

export const router = express.Router();

/**
 * GET /providers/user/:userId
 * Obtener proveedores asociados a un usuario
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    // Verificar que el usuario autenticado sea el mismo que está consultando
    if (req.user.sub !== req.params.userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const providers = await getProviderByUserId(req.params.userId);

    res.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error("Get providers by user error:", error);
    res.status(500).json({ error: "server error" });
  }
});
