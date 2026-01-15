// backend/auth.routes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body || {};

        if (!usuario || !senha) {
            return res.status(400).json({ error: 'Informe usuário e senha.' });
        }

        const adminUser = process.env.ADMIN_USER;
        const adminPassHash = process.env.ADMIN_PASSWORD_HASH;
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '30m';

        if (!adminUser || !adminPassHash || !secret) {
            return res.status(500).json({ error: 'Admin não configurado corretamente no .env.' });
        }

        if (usuario !== adminUser) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }

        const ok = await bcrypt.compare(senha, adminPassHash);
        if (!ok) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }

        // 🔐 gera o token
        const token = jwt.sign({ role: 'admin' }, secret, { expiresIn });

        // 🍪 salva o token no cookie HttpOnly
        res.cookie('admin_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production', // HTTPS no deploy
            maxAge: 30 * 60 * 1000, // 30 minutos
        });

        // ⚠️ NÃO retorna o token
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro no login.' });
    }
});

// logout (recomendado)
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ ok: true });
});

module.exports = router;
