import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getUserProfile } from "../services/user.js";

export const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
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