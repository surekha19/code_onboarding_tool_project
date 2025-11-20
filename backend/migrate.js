/**
 * Run node migrate.js to create tables
 */
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = process.env.DATABASE_FILE || 'onboard.db';
const db = new sqlite3.Database(DB_FILE);

const sql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  age_group TEXT,
  role TEXT DEFAULT 'user',
  preferences_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutorials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  difficulty TEXT,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutorial_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT,
  is_checkable INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id),
  step_index INTEGER,
  completed INTEGER DEFAULT 0,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  android_url TEXT,
  ios_url TEXT,
  safe_score INTEGER,
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  title TEXT,
  description TEXT,
  importance INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  item_id INTEGER REFERENCES checklist_items(id),
  completed INTEGER DEFAULT 0,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  tutorial_id INTEGER REFERENCES tutorials(id),
  rating INTEGER,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES users(id),
  action TEXT,
  meta_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(sql, (err) => {
  if (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } else {
    console.log('Migration complete.');
    process.exit(0);
  }
});
