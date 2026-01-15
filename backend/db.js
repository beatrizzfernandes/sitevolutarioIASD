// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

async function createConnection() {
  const db = await open({
    filename: path.join(__dirname, 'bdd.sqlite'),
    driver: sqlite3.Database,
  });

  // Ativa integridade referencial (obrigatório no SQLite)
  await db.exec('PRAGMA foreign_keys = ON;');

  // ---------- TABELA DE EVENTOS ----------
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data_inicio TEXT NOT NULL,   -- '2026-07-12'
      data_fim TEXT,               -- '2026-07-15'
      horario TEXT,                -- '15:00'
      local TEXT NOT NULL,
      descricao TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ---------- TABELA DE VAGAS DE VOLUNTARIADO (PAI) ----------
  await db.exec(`
    CREATE TABLE IF NOT EXISTS volunteer_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      igreja TEXT NOT NULL,
      email_destino TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ---------- TABELA DE INSCRIÇÕES (FILHA) ----------
  await db.exec(`
    CREATE TABLE IF NOT EXISTS volunteer_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_role_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT,
      mensagem TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_role_id) REFERENCES volunteer_roles(id) ON DELETE CASCADE
    );
  `);

  // Índice (melhora listagens / joins por vaga)
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_vol_apps_role_id
    ON volunteer_applications(volunteer_role_id);
  `);

  return db;
}

function getDb() {
  if (!dbPromise) dbPromise = createConnection();
  return dbPromise;
}

module.exports = {
  all: async (sql, params = []) => {
    const db = await getDb();
    return db.all(sql, params);
  },
  get: async (sql, params = []) => {
    const db = await getDb();
    return db.get(sql, params);
  },
  run: async (sql, params = []) => {
    const db = await getDb();
    return db.run(sql, params);
  },
  exec: async (sql) => {
    const db = await getDb();
    return db.exec(sql);
  },
};
