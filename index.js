const express = require('express');
const cors = require('cors')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let users = [];
let count = 0

app.use(express.static('dist'))
app.use(cors())

app.get('/', (req, res) => {
  
});

io.on('connection', (socket) => {
  if (users.length >= 2) return;
  users.push({
    id: socket.id,
    socket,
    gesture: "",
  });

  console.log('a user connected');
  socket.on('disconnect', () => {
    users = users.filter(({id}) => id !== socket.id)
  });

  socket.on("play", async (gesture) => {
    count++
    users.find(({id}) => id === socket.id).gesture = gesture

    if (count >= 2) {
      count = 0
      if (users[0]) {
        users[0].socket.emit('finish', users[1].gesture)
      }
      if (users[1]) {
        users[1].socket.emit('finish', users[0].gesture)
      }
      return 
    }
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});