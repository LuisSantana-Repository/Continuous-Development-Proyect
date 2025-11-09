import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getProviderByUserId } from "../services/provider.js";
import { getProviderCalendar } from "../services/providerCalendar.js";

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

/**
 * GET /providers/:providerId/calendar
 * Obtener calendario del proveedor con service requests
 * Query params: month (YYYY-MM, opcional, default: mes actual)
 */
router.get("/:providerId/calendar", authenticate, async (req, res) => {
  try {
    const { providerId } = req.params;

    // Obtener el mes del query param o usar el mes actual
    let month = req.query.month;
    if (!month) {
      const now = new Date();
      const year = now.getFullYear();
      const monthNum = String(now.getMonth() + 1).padStart(2, "0");
      month = `${year}-${monthNum}`;
    }

    // Validar formato del mes (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({
        error: "invalid month format",
        message: "El formato del mes debe ser YYYY-MM (ej: 2025-11)",
      });
    }

    const calendarData = await getProviderCalendar(parseInt(providerId), month);

    res.json({
      success: true,
      data: calendarData,
    });
  } catch (error) {
    console.error("Get provider calendar error:", error);

    if (error.message === "Proveedor no encontrado") {
      return res.status(404).json({ error: "provider not found" });
    }

    res.status(500).json({ error: "server error" });
  }
});
