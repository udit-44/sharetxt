const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuid } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sessions = new Map(); // sessionId -> Set of sockets

// ✅ Serve built React frontend
app.use(express.static(path.join(__dirname, 'public')));

// ✅ React Router fallback (for /room/:id routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ WebSocket logic
wss.on('connection', (ws) => {
  let sessionId;

  ws.on('message', (msg) => {
    try {
      const { type, data, id } = JSON.parse(msg);

      if (type === 'join') {
        sessionId = id || uuid();

        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, new Set());
          console.log(`🆕 Room created: ${sessionId}`);
        }

        sessions.get(sessionId).add(ws);
        ws.send(JSON.stringify({ type: 'joined', id: sessionId }));
      }

      if (type === 'text') {
        const clients = sessions.get(sessionId) || new Set();
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'text', data }));
          }
        });
      }
    } catch (e) {
      console.error('❌ Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (sessionId && sessions.has(sessionId)) {
      sessions.get(sessionId).delete(ws);
      if (sessions.get(sessionId).size === 0) {
        sessions.delete(sessionId);
        console.log(`🗑️ Room deleted: ${sessionId}`);
      }
    }
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
