const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Configuration minimale
app.use(express.static(path.join(__dirname)));

// Stockage mémoire (pour démo)
let messages = [];

io.on('connection', (socket) => {
  // Envoi de l'historique
  socket.emit('init', messages.slice(-50));

  // Réception des messages
  socket.on('message', (msg) => {
    messages.push(msg);
    io.emit('message', msg); // Diffusion à tous
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur ${PORT}`));
