const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./mmo.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    x REAL DEFAULT 100,
    y REAL DEFAULT 100,
    map TEXT DEFAULT 'town',
    hp INTEGER DEFAULT 100,
    maxHp INTEGER DEFAULT 100,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    hairStyle TEXT DEFAULT '1',
    hairColor TEXT DEFAULT '#8B4513',
    eyeColor TEXT DEFAULT '#000000',
    skinColor TEXT DEFAULT '#F1C27D',
    shirtColor TEXT DEFAULT '#1E90FF',
    pantsColor TEXT DEFAULT '#2F4F4F',
    inventory TEXT DEFAULT '{"weapons":[{"name":"Wooden Sword","damage":5}],"armor":[{"name":"Leather Armor","defense":2}],"potions":[{"name":"Health Potion","heal":20}]}',
    equipped TEXT DEFAULT '{"weapon":null,"armor":null}'
  )`);
});

module.exports = { db };
