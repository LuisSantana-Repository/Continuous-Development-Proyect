import express from "express";
import { registerUser, loginUser } from "../services/auth.js";
import { validateRegister, validateLogin } from "../utils/validators.js";

export const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const validationError = validateRegister(req.body);
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

router.post('/login', async (req, res) => {
    try {
        const validationError = validateLogin(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const result = await loginUser(req.body.email, req.body.password);
        res.status(200).json(result);

    } catch (error) {
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ error: "invalid credentials" });
        }
        console.error("Login error:", error);
        res.status(500).json({ error: "server error" });
    }
});