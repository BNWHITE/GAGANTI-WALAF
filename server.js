const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Gestion du chat
const messages = [];
io.on('connection', (socket) => {
  // Envoyer l'historique
  socket.emit('loadMessages', messages.slice(-50));

  socket.on('sendMessage', (text) => {
    const msg = {
      user: socket.username || 'Nit',
      text,
      time: new Date().toLocaleTimeString()
    };
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('join', (username) => {
    socket.username = username;
  });
});

server.listen(3000, () => console.log(`
Serveur prêt :
- Éditeur : http://localhost:3000/index.html
- Chat : http://localhost:3000/waxtaan.html
`));
