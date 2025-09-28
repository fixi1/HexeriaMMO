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
          weapons: [{ name: 'Wooden Sword', damage: 5 }],
          armor: [{ name: 'Leather Armor', defense: 2 }],
          potions: [{ name: 'Health Potion', heal: 20 }]
        });
        const eq = JSON.stringify({ weapon: null, armor: null });

        db.run(`INSERT INTO players (id, name, class, x, y, map, hp, maxHp, xp, level, hairStyle, hairColor, eyeColor, skinColor, shirtColor, pantsColor, inventory, equipped) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, msg.name, msg.class, 100, 100, 'town', 100, 100, 0, 1, msg.hairStyle, msg.hairColor, msg.eyeColor, msg.skinColor, msg.shirtColor, msg.pantsColor, inv, eq],
          (err) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', message: 'DB error' }));
              return;
            }

            const player = {
              id, name: msg.name, class: msg.class, x: 100, y: 100, map: 'town',
              hp: 100, maxHp: 100, xp: 0, level: 1,
              hairStyle: msg.hairStyle, hairColor: msg.hairColor, eyeColor: msg.eyeColor,
              skinColor: msg.skinColor, shirtColor: msg.shirtColor, pantsColor: msg.pantsColor,
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
        p.x = Math.max(0, Math.min(768, msg.x));
        p.y = Math.max(0, Math.min(568, msg.y));
        db.run('UPDATE players SET x = ?, y = ? WHERE id = ?', [p.x, p.y, playerId]);
        broadcast({ type: 'move', id: playerId, x: p.x, y: p.y }, ws);
      }

      else if (msg.type === 'usePotion' && players[playerId]) {
        const p = players[playerId];
        if (p.inventory.potions.length > 0) {
          const potion = p.inventory.potions.shift();
          p.hp = Math.min(p.maxHp, p.hp + potion.heal);
          db.run('UPDATE players SET hp = ?, inventory = ? WHERE id = ?', [p.hp, JSON.stringify(p.inventory), playerId]);
          ws.send(JSON.stringify({ type: 'updateStats', hp: p.hp }));
          broadcast({ type: 'playerUsedPotion', id: playerId, name: potion.name }, ws);
        }
      }

      else if (msg.type === 'equip' && players[playerId]) {
        const { slot, item } = msg;
        players[playerId].equipped[slot] = item;
        db.run('UPDATE players SET equipped = ? WHERE id = ?', [JSON.stringify(players[playerId].equipped), playerId]);
        ws.send(JSON.stringify({ type: 'updateEquipped', equipped: players[playerId].equipped }));
      }

      else if (msg.type === 'chat' && players[playerId]) {
        broadcast({
          type: 'chat',
          id: playerId,
          name: players[playerId].name,
          message: msg.message
        }, ws);
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
