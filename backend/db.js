// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let dbPromise = null;

function resolveDbPath() {
  // Preferência: env var (Render)
  if (process.env.DB_PATH) return process.env.DB_PATH;

  // Render com disco persistente montado em /data
  if (process.env.RENDER) return '/data/bdd.sqlite';

  // Local/dev
  return path.join(__dirname, 'bdd.sqlite');
}

async function initDb(db) {
  await db.exec('PRAGMA foreign_keys = ON;');

  // ---------- TABELA DE EVENTOS ----------
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data_inicio TEXT NOT NULL,
      data_fim TEXT,
      horario TEXT,
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
}

async function createConnection() {
  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);

  // Garante que a pasta existe (no Render, use /data via DB_PATH ou disco persistente)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await initDb(db);
  return db;
}

async function getDb() {
  if (!dbPromise) dbPromise = createConnection();
  return dbPromise;
}

module.exports = {
  all: async (sql, params = []) => (await getDb()).all(sql, params),
  get: async (sql, params = []) => (await getDb()).get(sql, params),
  run: async (sql, params = []) => (await getDb()).run(sql, params),
  exec: async (sql) => (await getDb()).exec(sql),
  // (opcional) exporta getDb se algum arquivo usar diretamente
  getDb,
};
