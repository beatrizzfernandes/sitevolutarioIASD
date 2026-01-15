const express = require('express');
const router = express.Router();
const db = require('./db');
const { authAdmin } = require('./middleware');

// listar eventos (público)
router.get('/', async (req, res) => {
    const events = await db.all('SELECT * FROM events ORDER BY data_inicio');
    res.json(events);
});

// criar evento (somente admin)
router.post('/', authAdmin, async (req, res) => {
    const { titulo, data_inicio, data_fim, horario, local, descricao } = req.body;

    await db.run(
        `INSERT INTO events (titulo, data_inicio, data_fim, horario, local, descricao)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [titulo, data_inicio, data_fim, horario, local, descricao]
    );

    res.status(201).json({ message: 'Evento criado' });
});

// atualizar evento (somente admin)
router.put('/:id', authAdmin, async (req, res) => {
    const { id } = req.params;
    const { titulo, data_inicio, data_fim, horario, local, descricao } = req.body;

    await db.run(
        `UPDATE events
     SET titulo = ?, data_inicio = ?, data_fim = ?, horario = ?, local = ?, descricao = ?
     WHERE id = ?`,
        [titulo, data_inicio, data_fim, horario, local, descricao, id]
    );

    res.json({ message: 'Evento atualizado' });
});

// deletar evento (somente admin)
router.delete('/:id', authAdmin, async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Evento excluído' });
});

module.exports = router;
