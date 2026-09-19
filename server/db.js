// db.js — SQLite connection and schema.
// Uses better-sqlite3 (synchronous API) for simplicity in a small CRUD app.

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, 'capsule.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    prompt_title TEXT NOT NULL,
    prompt_version TEXT,
    prompt_text TEXT NOT NULL,
    response_summary TEXT,
    category TEXT,
    usefulness TEXT,
    reviewed INTEGER DEFAULT 0,
    improved INTEGER DEFAULT 0,
    screenshot_url TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
