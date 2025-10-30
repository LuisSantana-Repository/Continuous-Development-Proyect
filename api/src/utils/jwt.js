import jwt from "jsonwebtoken";

export function generateToken(userId, isProvider) {
    return jwt.sign(
        { sub: userId, provider: isProvider },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: "24h" }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"]
    });
}