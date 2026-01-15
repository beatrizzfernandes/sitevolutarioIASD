const jwt = require('jsonwebtoken');

function authAdmin(req, res, next) {
    const fromCookie = req.cookies?.admin_token;
    const fromHeader = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null;

    const token = fromCookie || fromHeader;
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== 'admin') return res.status(403).json({ error: 'Sem permissão.' });
        next();
    } catch {
        return res.status(401).json({ error: 'Sessão expirada.' });
    }
}

module.exports = { authAdmin };

