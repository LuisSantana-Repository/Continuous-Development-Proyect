import express from "express";
import { getS3Object } from "../services/storage.js";

export const router = express.Router();

/**
 * Endpoint para servir imágenes desde S3
 * GET /images/:key
 */
router.get("/*", async (req, res) => {
  try {
    // Obtener el key completo de la URL (puede incluir subdirectorios)
    const key = req.params[0]; // Captura todo después de /images/

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "Image key is required",
      });
    }

    console.log(`Fetching image from S3: ${key}`);

    // Obtener el objeto desde S3
    const imageData = await getS3Object(key);

    // Determinar el content type basado en la extensión o usar default
    const contentType = imageData.ContentType || "image/jpeg";

    // Configurar headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache por 1 año

    // Enviar la imagen
    res.send(imageData.Body);
  } catch (error) {
    console.error("Get image error:", error);

    // Si la imagen no existe, devolver 404
    if (error.name === "NoSuchKey" || error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch image",
    });
  }
});
