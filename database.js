const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./mmo.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    x REAL DEFAULT 100,
    y REAL DEFAULT 100,
    hp INTEGER DEFAULT 100,
    maxHp INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    maxMana INTEGER DEFAULT 50,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    gold INTEGER DEFAULT 0,
    inventory TEXT DEFAULT '{
      "weapons": [{"id":"sword1","name":"Iron Sword","damage":10,"rarity":"common"}],
      "armor": [{"id":"armor1","name":"Chainmail","defense":5,"rarity":"common"}],
      "potions": [{"id":"hp1","name":"Health Potion","heal":30,"rarity":"common"}],
      "materials": [{"id":"wood","name":"Wood","amount":10}]
    }',
    equipped TEXT DEFAULT '{"weapon":"sword1","armor":"armor1"}'
  )`);
});

module.exports = { db };
