CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  data_inicio TEXT NOT NULL,   -- '2025-07-12'
  data_fim TEXT,               -- '2025-07-14'
  horario TEXT,                -- '15:00'
  local TEXT NOT NULL,
  descricao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
