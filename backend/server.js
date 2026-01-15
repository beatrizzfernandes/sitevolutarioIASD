require('dotenv').config();
const jwt = require('jsonwebtoken');
const authRouter = require('./auth.routes');
const express = require('express');
const path = require('path');
require('dotenv').config();

const eventsRouter = require('./events.routes');
const volunteersRouter = require('./volunteers.routes');

const applicationsRouter = require('./applications.routes');

const contactRouter = require('./contact.routes');

const app = express();
const PORT = 3000;

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 min
    max: 10,                  // 10 tentativas
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

const cookieParser = require('cookie-parser');

const helmet = require('helmet');
app.use(helmet());

app.use(cookieParser());


function requireAdminPage(req, res, next) {
    const token = req.cookies?.admin_token;

    if (!token) {
        return res.redirect('/admin-login.html?msg=' + encodeURIComponent('Faça login para continuar.'));
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== 'admin') return res.redirect('/admin-login.html?msg=' + encodeURIComponent('Sem permissão.'));
        return next();
    } catch {
        return res.redirect('/admin-login.html?msg=' + encodeURIComponent('Sessão expirada. Faça login novamente.'));
    }
}

app.get('/admin', (req, res) => res.redirect('/admin.html'));
app.get('/admin.html', requireAdminPage);
app.use('/admin', requireAdminPage);


// (opcional) protege outras páginas admin
// app.get('/admin-login.html', (req,res,next)=>next()); // login é público


// antes do auth routes:
app.use('/api/auth/login', loginLimiter);

// ? PRECISA vir antes das rotas
app.use(express.urlencoded({ extended: true }));
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

// arquivos do front
app.use(express.static(path.join(__dirname, '..', 'public')));

// rotas da API
app.use('/api/contact', contactRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/volunteers', volunteersRouter);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

