const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'alpuguducu-portfolio-secret-2026';

function generateToken(admin) {
    return jwt.sign(
        { id: admin.id, username: admin.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyAuth(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Oturum süresi dolmuş, tekrar giriş yapın.' });
    }
}

module.exports = { generateToken, verifyAuth };
