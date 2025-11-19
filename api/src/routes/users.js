import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getUserProfile, updateUserProfile } from "../services/user.js";

export const router = express.Router();

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await getUserProfile(req.user.sub);
    res.status(200).json({ user });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "user not found" });
    }
    console.error("Get user error:", error);
    res.status(500).json({ error: "server error" });
  }
});

router.patch("/me", authenticate, async (req, res) => {
  try {
    const allowedUpdates = ["username", "email", "address", "Foto"];
    const updates = {};

    // Solo incluir campos permitidos que vengan en el body
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "no valid fields to update" });
    }

    const user = await updateUserProfile(req.user.sub, updates);
    res.status(200).json({ user });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "user not found" });
    }
    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ error: "email already in use" });
    }
    console.error("Update user error:", error);
    res.status(500).json({ error: "server error" });
  }
});
