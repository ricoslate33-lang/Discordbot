import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'bot.sqlite');

const db = new Database(DB_PATH);

// Simple migration runner — idempotent
function migrate() {
  // settings table for guild-level settings (JSON values)
  db.prepare(`CREATE TABLE IF NOT EXISTS settings (
    guildId TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (guildId, key)
  );`).run();

  // chat memory: per-user-per-channel rolling buffer (keep insertion order)
  db.prepare(`CREATE TABLE IF NOT EXISTS chat_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    guildId TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );`).run();

  db.prepare(`CREATE INDEX IF NOT EXISTS idx_chat_memory_user_channel ON chat_memory(userId, channelId);`).run();

  // warnings
  db.prepare(`CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    guildId TEXT NOT NULL,
    moderatorId TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );`).run();

  // akinator sessions stored as JSON
  db.prepare(`CREATE TABLE IF NOT EXISTS akinator_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    guildId TEXT,
    questionCount INTEGER DEFAULT 0,
    history TEXT DEFAULT '[]',
    started_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    last_updated INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );`).run();

  // automod settings
  db.prepare(`CREATE TABLE IF NOT EXISTS automod_settings (
    guildId TEXT PRIMARY KEY,
    settings TEXT NOT NULL
  );`).run();

  // simple stats table
  db.prepare(`CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    key TEXT,
    value INTEGER DEFAULT 0
  );`).run();
}

migrate();

export function getDb() { return db; }

export default db;