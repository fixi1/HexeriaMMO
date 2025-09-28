const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('.'));
app.use(express.json());

// Simulate DB (in memory for now - can be replaced with SQLite later)
const players = {};

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

wss.on('connection', (ws) => {
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'init') {
        // Generate new player
        playerId = Math.random().toString(36).substring(2, 10);
        players[playerId] = {
          id: playerId,
          name: msg.name || 'Player',
          class: msg.class || 'Warrior',
          color: msg.color || '#ff5722',
          x: 100 + Math.random() * 600,
          y: 50 + Math.random() * 400,
          hp: 100,
          maxHp: 100,
          xp: 0,
          level: 1,
          inventory: {
            weapons: [{ name: 'Wooden Sword', damage: 5 }],
            armor: [{ name: 'Leather Armor', defense: 2 }],
            potions: [{ name: 'Health Potion', heal: 20 }]
          },
          equipped: {
            weapon: null,
            armor: null
          }
        };

        ws.send(JSON.stringify({
          type: 'init',
          playerId,
          player: players[playerId]
        }));

        // Notify others
        broadcast({ type: 'playerJoined', player: players[playerId] }, ws);
      }

      else if (msg.type === 'move' && players[playerId]) {
        players[playerId].x = Math.max(0, Math.min(770, msg.x));
        players[playerId].y = Math.max(0, Math.min(570, msg.y));
        broadcast({ type: 'move', id: playerId, x: players[playerId].x, y: players[playerId].y }, ws);
      }

      else if (msg.type === 'usePotion' && players[playerId]) {
        const p = players[playerId];
        if (p.inventory.potions.length > 0) {
          const potion = p.inventory.potions.shift();
          p.hp = Math.min(p.maxHp, p.hp + potion.heal);
          ws.send(JSON.stringify({ type: 'updateStats', hp: p.hp }));
          broadcast({ type: 'playerUsedPotion', id: playerId, name: potion.name }, ws);
        }
      }

      else if (msg.type === 'equip' && players[playerId]) {
        const { slot, item } = msg;
        players[playerId].equipped[slot] = item;
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
      console.error('Error processing message:', e);
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
  console.log(`Server running on port ${PORT}`);
});
