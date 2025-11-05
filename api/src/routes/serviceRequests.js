import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createServiceRequest,
  getServiceRequestById,
  getUserServiceRequests,
  getProviderServiceRequests,
  updateServiceRequestStatus,
  cancelServiceRequest,
} from "../services/serviceRequest.js";
import {
  validateServiceRequest,
  validateServiceRequestUpdate,
} from "../utils/validators.js";

export const router = express.Router();

/**
 * POST /service-requests
 * Crear una nueva solicitud de servicio
 */
router.post("/", authenticate, async (req, res) => {
  try {
    // Validar datos
    const validationError = await validateServiceRequest({
      ...req.body,
      userId: req.user.sub, // Usuario autenticado del token
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Crear solicitud
    const result = await createServiceRequest({
      ...req.body,
      userId: req.user.sub,
    });

    res.status(201).json({
      success: true,
      requestId: result.requestId,
      message: "Service request created successfully",
    });
  } catch (error) {
    if (error.message === "PROVIDER_NOT_FOUND") {
      return res.status(404).json({ error: "provider not found" });
    }
    console.error("Create service request error:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /service-requests/:requestId
 * Obtener una solicitud específica
 */
router.get("/:requestId", authenticate, async (req, res) => {
  try {
    const request = await getServiceRequestById(req.params.requestId);

    // Verificar que el usuario autenticado sea el dueño o el proveedor
    if (
      request.user_id !== req.user.sub &&
      !req.user.provider // TODO: Validar que sea el proveedor correcto
    ) {
      return res.status(403).json({ error: "forbidden" });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    if (error.message === "REQUEST_NOT_FOUND") {
      return res.status(404).json({ error: "request not found" });
    }
    console.error("Get service request error:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /service-requests/user/:userId
 * Obtener todas las solicitudes de un usuario (cliente)
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    // Verificar que el usuario autenticado sea el mismo que está consultando
    if (req.user.sub !== req.params.userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status; // Filtro opcional

    const result = await getUserServiceRequests(
      req.params.userId,
      page,
      pageSize,
      status
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get user service requests error:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /service-requests/provider/:providerId
 * Obtener todas las solicitudes recibidas por un proveedor
 */
router.get("/provider/:providerId", authenticate, async (req, res) => {
  try {
    // Verificar que el usuario autenticado sea un proveedor
    if (!req.user.provider) {
      return res.status(403).json({ error: "forbidden - providers only" });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status; // Filtro opcional

    const result = await getProviderServiceRequests(
      req.params.providerId,
      page,
      pageSize,
      status
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get provider service requests error:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * PATCH /service-requests/:requestId
 * Actualizar el estado de una solicitud
 */
router.patch("/:requestId", authenticate, async (req, res) => {
  try {
    // Validar campos de actualización
    const validationError = validateServiceRequestUpdate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Obtener la solicitud actual para validar permisos
    const currentRequest = await getServiceRequestById(req.params.requestId);

    // Lógica de permisos según el campo que se actualiza
    const { status, payment_status, amount } = req.body;

    if (status) {
      // Solo el proveedor puede cambiar a accepted, rejected, in_progress, completed
      if (
        ["accepted", "rejected", "in_progress", "completed"].includes(status)
      ) {
        if (!req.user.provider) {
          return res
            .status(403)
            .json({ error: "only providers can change to this status" });
        }
      }

      // Solo el cliente puede cancelar
      if (status === "cancelled" && currentRequest.user_id !== req.user.sub) {
        return res
          .status(403)
          .json({ error: "only the client can cancel the request" });
      }
    }

    // Actualizar solicitud
    const result = await updateServiceRequestStatus(
      req.params.requestId,
      req.body
    );

    res.json({
      success: true,
      data: result,
      message: "Service request updated successfully",
    });
  } catch (error) {
    if (error.message === "REQUEST_NOT_FOUND") {
      return res.status(404).json({ error: "request not found" });
    }
    if (error.message === "NO_VALID_FIELDS") {
      return res.status(400).json({ error: "no valid fields to update" });
    }
    console.error("Update service request error:", error);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * DELETE /service-requests/:requestId
 * Cancelar una solicitud (soft delete)
 */
router.delete("/:requestId", authenticate, async (req, res) => {
  try {
    // Obtener la solicitud para verificar permisos
    const currentRequest = await getServiceRequestById(req.params.requestId);

    // Solo el cliente que creó la solicitud puede cancelarla
    if (currentRequest.user_id !== req.user.sub) {
      return res
        .status(403)
        .json({ error: "only the client can cancel the request" });
    }

    await cancelServiceRequest(req.params.requestId);

    res.json({
      success: true,
      message: "Service request cancelled successfully",
    });
  } catch (error) {
    if (error.message === "REQUEST_NOT_FOUND") {
      return res.status(404).json({ error: "request not found" });
    }
    console.error("Cancel service request error:", error);
    res.status(500).json({ error: "server error" });
  }
});
