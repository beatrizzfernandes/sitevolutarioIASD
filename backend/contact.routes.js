// backend/contact.routes.js
const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // senha de app
    },
});

router.post('/', async (req, res) => {
    const { nome, telefone, email, mensagem } = req.body || {};

    if (!nome || !email || !mensagem) {
        return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
    }

    if (!process.env.CONTACT_TO) {
        return res.status(500).json({ error: 'CONTACT_TO não definido no .env' });
    }

    try {
        await transporter.sendMail({
            from: `"Portal Evangelista" <${process.env.MAIL_USER}>`,
            to: process.env.CONTACT_TO,
            replyTo: email, // responder vai para o e-mail do visitante
            subject: `Contato do site - ${nome}`,
            text: `
Nome: ${nome}
E-mail: ${email}
Telefone: ${telefone || '(não informado)'}

Mensagem:
${mensagem}
      `.trim(),
        });

        return res.json({ message: 'Mensagem enviada com sucesso.' });
    } catch (err) {
        console.error('ERRO AO ENVIAR CONTATO:', err);
        return res.status(500).json({ error: 'Falha ao enviar e-mail de contato.' });
    }
});

module.exports = router;
