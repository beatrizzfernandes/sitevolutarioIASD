// backend/volunteers.routes.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const { authAdmin } = require('./middleware');
const nodemailer = require('nodemailer');

// transporter de e-mail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// LISTAR vagas (público)
router.get('/', async (req, res) => {
    const roles = await db.all('SELECT * FROM volunteer_roles ORDER BY created_at DESC');
    res.json(roles);
});

// CRIAR vaga (admin)
router.post('/', authAdmin, async (req, res) => {
    const { titulo, descricao, igreja, email_destino } = req.body || {};

    if (!titulo || !igreja || !email_destino) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    await db.run(
        `INSERT INTO volunteer_roles (titulo, descricao, igreja, email_destino)
     VALUES (?, ?, ?, ?)`,
        [titulo, descricao || null, igreja, email_destino]
    );

    res.status(201).json({ message: 'Vaga criada' });
});

// ATUALIZAR vaga (admin)
router.put('/:id', authAdmin, async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, igreja, email_destino } = req.body;

    await db.run(
        `UPDATE volunteer_roles
     SET titulo = ?, descricao = ?, igreja = ?, email_destino = ?
     WHERE id = ?`,
        [titulo, descricao || null, igreja, email_destino, id]
    );

    res.json({ message: 'Vaga atualizada' });
});

// DELETAR vaga (admin)
router.delete('/:id', authAdmin, async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM volunteer_roles WHERE id = ?', [id]);
    res.json({ message: 'Vaga excluída' });
});

//Inscrição em vaga (público) envia e-mail
router.post('/:id/apply', async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, mensagem } = req.body || {};

    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    const role = (await db.all('SELECT * FROM volunteer_roles WHERE id = ?', [id]))[0];
    if (!role) {
        return res.status(404).json({ error: 'Vaga não encontrada.' });
    }

    // 1) salva a inscrição no banco
    await db.run(
        `INSERT INTO volunteer_applications (volunteer_role_id, nome, email, telefone, mensagem)
     VALUES (?, ?, ?, ?, ?)`,
        [id, nome, email, telefone || null, mensagem || null]
    );

    // 2) tenta enviar e-mail (se falhar, a inscrição ainda ficou salva)
    try {
        await transporter.sendMail({
            from: `"Portal Evangelista" <${process.env.MAIL_USER}>`,
            to: role.email_destino,
            subject: `Nova inscrição para voluntariado: ${role.titulo}`,
            text: `
Vaga: ${role.titulo}
Igreja: ${role.igreja}

Nome: ${nome}
E-mail: ${email}
Telefone: ${telefone || '(não informado)'}
Mensagem:
${mensagem || '(sem mensagem)'}
      `.trim(),
        });

        return res.json({ message: 'Inscrição registrada e e-mail enviado.' });
    } catch (err) {
        console.error('ERRO AO ENVIAR E-MAIL:', err);
        return res.status(200).json({
            message: 'Inscrição registrada, mas o e-mail falhou.',
        });
    }
});


module.exports = router;
