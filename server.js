const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { db } = require('./database');
const { CLASSES } = require('./game/classes');
const { ITEMS } = require('./game/items');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(express.json());

const players = {};
const MAPS = {
  town: { width: 1000, height: 800, safe: true },
  forest: { width: 1200, height: 1000, safe: false }
};

// Funcții de combat, quest, etc.
function calculateDamage(attacker, defender) {
  const weapon = attacker.equipped.weapon;
  const baseDmg = weapon ? weapon.damage : 5;
  return Math.max(1, baseDmg - (defender.equipped.armor?.defense || 0));
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

wss.on('connection', (ws) => {
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'createCharacter') {
        // Creează caracter cu toate sistemele
        const id = Math.random().toString(36).substring(2, 10);
        const cls = CLASSES[msg.class];
        const inv = JSON.stringify({
          weapons: [ITEMS.weapons[0]],
          armor: [ITEMS.armor[0]],
          potions: [ITEMS.potions[0], ITEMS.potions[1]],
          materials: [ITEMS.materials[0], ITEMS.materials[1]]
        });
        const eq = JSON.stringify({ weapon: 'sword_iron', armor: 'armor_chain' });
        const stats = JSON.stringify(cls.baseStats);

        db.run(`INSERT INTO players (id, name, class, level, hp, maxHp, mana, maxMana, stamina, gold, map, x, y, inventory, equipped, stats) 
                VALUES (?, ?, ?, 1, 100, 100, 50, 50, 100, 0, 'town', 100, 100, ?, ?, ?)`,
          [id, msg.name, msg.class, inv, eq, stats], (err) => {
            if (err) return ws.send(JSON.stringify({ type: 'error', message: 'Name taken' }));
            
            const player = {
              id, name: msg.name, class: msg.class, level: 1, hp: 100, maxHp: 100,
              mana: 50, maxMana: 50, stamina: 100, gold: 0, map: 'town', x: 100, y: 100,
              inventory: JSON.parse(inv), equipped: JSON.parse(eq), stats: JSON.parse(stats)
            };
            
            playerId = id;
            players[id] = player;
            ws.send(JSON.stringify({ type: 'init', playerId, player }));
            broadcast({ type: 'playerJoined', player }, ws);
          }
        );
      }

      // Alte mesaje: move, attack, useItem, quest, etc.
      else if (msg.type === 'attack') {
        const attacker = players[playerId];
        const target = players[msg.targetId];
        if (attacker && target && attacker.map === target.map) {
          const damage = calculateDamage(attacker, target);
          target.hp = Math.max(0, target.hp - damage);
          
          if (target.hp <= 0) {
            // Sistem de loot + XP
            attacker.xp += 10;
            attacker.gold += 5;
            broadcast({ type: 'playerKilled', killer: attacker.id, victim: target.id }, ws);
            // Respawn
            setTimeout(() => {
              if (players[target.id]) {
                target.hp = target.maxHp;
                target.x = 100; target.y = 100; target.map = 'town';
                broadcast({ type: 'respawn', id: target.id, x: 100, y: 100 }, ws);
              }
            }, 5000);
          }
          broadcast({ type: 'damage', target: msg.targetId, amount: damage }, ws);
        }
      }

    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    if (players[playerId]) {
      broadcast({ type: 'playerLeft', id: playerId });
      delete players[playerId];
    }
  });
});

function broadcast(data, exclude = null) {
  wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ HexeriaMMO running on port ${PORT}`);
});