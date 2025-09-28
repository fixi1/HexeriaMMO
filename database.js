const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./hexeriammo.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    class TEXT NOT NULL,
    race TEXT DEFAULT 'Human',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    hp INTEGER DEFAULT 100,
    maxHp INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    maxMana INTEGER DEFAULT 50,
    stamina INTEGER DEFAULT 100,
    gold INTEGER DEFAULT 0,
    map TEXT DEFAULT 'town',
    x REAL DEFAULT 100,
    y REAL DEFAULT 100,
    guild TEXT,
    inventory TEXT,
    equipped TEXT,
    stats TEXT,
    quests TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = { db };