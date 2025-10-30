export function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'token expired' });
    }

    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'duplicate entry' });
    }

    // Default error
    res.status(500).json({ error: 'internal server error' });
}