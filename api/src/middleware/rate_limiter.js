import rateLimit from 'express-rate-limit';


// Prevencion de ataques de fuerza bruta y/o diccionarios
export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Limitar cada IP a 10 solicitudes por ventanaMs
    skipSuccessfulRequests: true,   // solo cuenta errores
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
});