const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const players = {};

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).substring(2, 10);
  players[id] = { id, x: 100, y: 100 };

  ws.send(JSON.stringify({ type: 'init', id }));

  wss.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'new', id, x: 100, y: 100 }));
    }
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'move') {
        players[id].x = Math.max(0, Math.min(770, msg.x));
        players[id].y = Math.max(0, Math.min(570, msg.y));
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'move', id, x: players[id].x, y: players[id].y }));
          }
        });
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    delete players[id];
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'remove', id }));
      }
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
