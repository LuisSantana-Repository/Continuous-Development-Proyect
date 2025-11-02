import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        //get token from cookies
        const token = req.cookies.token;
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