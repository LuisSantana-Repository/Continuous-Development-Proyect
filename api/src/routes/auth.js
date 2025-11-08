import express from "express";
import rateLimit from "express-rate-limit";

import { registerUser, loginUser } from "../services/auth.js";
import { validateRegister, validateLogin } from "../utils/validators.js";

export const router = express.Router();

// Prevencion de ataques de fuerza bruta y/o diccionarios
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limitar cada IP a 10 solicitudes por ventanaMs
  skipSuccessfulRequests: true, // solo cuenta errores
  handler: (req, res) => {
    res.status(429).json({ error: "Too many attempts. Try again later." });
  },
});

router.post("/register", limiter, async (req, res) => {
  try {
    const validationError = await validateRegister(req.body);
    console.log("Validation error:", validationError);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // console.log("Registering user with data:", req.body);
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "email already registered" });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "server error" });
  }
});

router.post("/logout", (req, res) => {
  try {
    // Limpiar la cookie del token
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "server error" });
  }
});

router.post("/login", limiter, async (req, res) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await loginUser(req.body.email, req.body.password);
    //send as cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 86400 * 1000,
    });
    res.status(200).json("Login successful");
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "invalid credentials" });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "server error" });
  }
});
