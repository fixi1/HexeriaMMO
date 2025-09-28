const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { db } = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(express.json());

const players = {};
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

// Simulează coliziuni (poți extinde cu hărți reale)
function hasCollision(x, y) {
  return x < 0 || y < 0 || x > MAP_WIDTH - 32 || y > MAP_HEIGHT - 32;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

wss.on('connection', (ws) => {
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'createPlayer') {
        const id = Math.random().toString(36).substring(2, 10);
        const inv = JSON.stringify({
          weapons: [{ id: 'sword1', name: 'Iron Sword', damage: 10, rarity: 'common' }],
          armor: [{ id: 'armor1', name: 'Chainmail', defense: 5, rarity: 'common' }],
          potions: [{ id: 'hp1', name: 'Health Potion', heal: 30, rarity: 'common' }],
          materials: [{ id: 'wood', name: 'Wood', amount: 10 }]
        });
        const eq = JSON.stringify({ weapon: 'sword1', armor: 'armor1' });

        db.run(`INSERT INTO players (id, name, class, x, y, hp, maxHp, mana, maxMana, xp, level, gold, inventory, equipped) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, msg.name, msg.class, 100, 100, 100, 100, 50, 50, 0, 1, 0, inv, eq],
          (err) => {
            if (err) return ws.send(JSON.stringify({ type: 'error', message: 'DB error' }));

            const player = {
              id, name: msg.name, class: msg.class, x: 100, y: 100,
              hp: 100, maxHp: 100, mana: 50, maxMana: 50, xp: 0, level: 1, gold: 0,
              inventory: JSON.parse(inv), equipped: JSON.parse(eq)
            };

            playerId = id;
            players[id] = player;
            ws.send(JSON.stringify({ type: 'init', playerId, player }));
            broadcast({ type: 'playerJoined', player }, ws);
          }
        );
      }

      else if (msg.type === 'move' && players[playerId]) {
        const p = players[playerId];
        const newX = Math.max(0, Math.min(MAP_WIDTH - 32, msg.x));
        const newY = Math.max(0, Math.min(MAP_HEIGHT - 32, msg.y));
        if (!hasCollision(newX, newY)) {
          p.x = newX;
          p.y = newY;
          db.run('UPDATE players SET x = ?, y = ? WHERE id = ?', [p.x, p.y, playerId]);
          broadcast({ type: 'move', id: playerId, x: p.x, y: p.y }, ws);
        }
      }

      else if (msg.type === 'attack' && players[playerId]) {
        const attacker = players[playerId];
        const targetId = msg.targetId;
        if (players[targetId] && targetId !== playerId) {
          const target = players[targetId];
          const weapon = attacker.inventory.weapons.find(w => w.id === attacker.equipped.weapon);
          const damage = weapon ? weapon.damage : 5;
          target.hp = Math.max(0, target.hp - damage);
          
          db.run('UPDATE players SET hp = ? WHERE id = ?', [target.hp, targetId]);
          broadcast({ type: 'attack', attackerId: playerId, targetId, damage }, ws);
          
          if (target.hp <= 0) {
            // Drop item la moarte
            const drop = target.inventory.materials[0] || { name: 'Gold', amount: 5 };
            attacker.gold += 5;
            db.run('UPDATE players SET gold = ? WHERE id = ?', [attacker.gold, playerId]);
            broadcast({ type: 'playerKilled', killerId: playerId, victimId: targetId, drop }, ws);
            // Respawn victim
            setTimeout(() => {
              if (players[targetId]) {
                target.hp = target.maxHp;
                target.x = 100;
                target.y = 100;
                db.run('UPDATE players SET hp = ?, x = ?, y = ? WHERE id = ?', [target.hp, target.x, target.y, targetId]);
                broadcast({ type: 'respawn', id: targetId, x: target.x, y: target.y }, ws);
              }
            }, 3000);
          }
        }
      }

      else if (msg.type === 'usePotion' && players[playerId]) {
        const p = players[playerId];
        if (p.inventory.potions.length > 0) {
          const potion = p.inventory.potions.shift();
          p.hp = Math.min(p.maxHp, p.hp + potion.heal);
          db.run('UPDATE players SET hp = ?, inventory = ? WHERE id = ?', [p.hp, JSON.stringify(p.inventory), playerId]);
          broadcast({ type: 'healEffect', id: playerId, amount: potion.heal }, ws);
        }
      }

      else if (msg.type === 'chat') {
        broadcast({ type: 'chat', id: playerId, name: players[playerId]?.name, message: msg.message }, ws);
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
  console.log(`✅ Server running on port ${PORT}`);
});
