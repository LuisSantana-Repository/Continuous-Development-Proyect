import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: "missing token" });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        });

        req.user = payload; // Attach to request
        next();
    } catch (error) {
        res.status(401).json({ error: "invalid token" });
    }
};