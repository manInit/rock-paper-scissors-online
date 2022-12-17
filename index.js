const express = require('express');
const cors = require('cors')
const app = express();
// const https = require('https');
const http = require('http');
const fs = require('fs');

// const options = {
//   key: fs.readFileSync('../conf/key.pem'),
//   cert: fs.readFileSync('../conf/cert.pem')
// };

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
  if (users.every(user => user.ready) && users.length > 1) {
    console.log('disconnect')
    socket.disconnect();
    return;
  }
  for (let user of users) {
    user.socket.emit('user-connect', socket.id)
  }
  socket.emit('init', users.map(u => u.id));

  users.push({
    id: socket.id,
    socket,
    gesture: "",
    ready: false
  });

  socket.on('disconnect', () => {
    if (users.length === 0) {
      count = 0;
      return;
    }
    users = users.filter(({id, gesture}) => {
      if (gesture && id === socket.id) {
        count--;
        if (count < 0) count = 0;
      }
      return id !== socket.id
    })
    for (let user of users) {
      user.socket.emit('user-disconnect', socket.id)
    }
  });

  socket.on('gameOver', async () => {
    socket.disconnect();
  })

  socket.on('ready', async () => {
    users.find(user => user.id === socket.id).ready = true
  })

  socket.on("play", async (gesture) => {
    count++
    const userFinded = users.find(({id}) => id === socket.id)
    if (userFinded) {
      userFinded.gesture = gesture
    }

    if (count >= users.length) {
      count = 0
      for (const user of users) {
        user.socket.emit('finish', [
          ...users.map(({id, gesture}) => [id, gesture])
        ])
        users.forEach(user => user.ready = false)
      }
      return 
    }
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});