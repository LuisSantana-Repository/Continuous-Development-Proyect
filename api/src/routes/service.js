import express from "express";
import {
  getServices,
  getProviderServices,
  getServiceById,
} from "../services/services.js";

export const router = express.Router();

// Obtener tipos de servicios (categorías)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const result = await getServices(page, pageSize);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
    });
  }
});

// Obtener servicios de proveedores
router.get("/providers", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const result = await getProviderServices(page, pageSize);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get provider services error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch provider services",
    });
  }
});

// Obtener un servicio específico por ID
router.get("/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        error: "Service ID is required",
      });
    }

    const result = await getServiceById(serviceId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get service by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service",
    });
  }
});
