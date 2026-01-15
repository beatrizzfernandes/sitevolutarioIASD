// backend/applications.routes.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const { authAdmin } = require('./middleware');

// listar inscrições (somente admin)
router.get('/', authAdmin, async (req, res) => {
  const items = await db.all(`
    SELECT
      a.id,
      a.nome,
      a.email,
      a.telefone,
      a.mensagem,
      a.created_at,
      v.titulo AS vaga_titulo,
      v.igreja AS vaga_igreja
    FROM volunteer_applications a
    JOIN volunteer_roles v ON v.id = a.volunteer_role_id
    ORDER BY a.created_at DESC
  `);

  res.json(items);
});

module.exports = router;
