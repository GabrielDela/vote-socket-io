const { Socket } = require('engine.io');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/poll', (req, res) => {
  res.sendFile(__dirname + '/poll.html');
});

var actualPoll = null;
var nbPlayers = -1;

io.on('connection', (socket) => {
  nbPlayers++;

  socket.on('disconnect', () => {
    nbPlayers--;
  });

  socket.on('button', (type) => {
    if(actualPoll != null){
      type == 1 ? actualPoll.vote1++ : actualPoll.vote2++;
      io.emit('initData', { actualPoll: actualPoll, nbPlayers: nbPlayers });
    }
  });

  socket.on('pollCreated', (data) => {

    actualPoll = {
      question: data.question,
      name: data.proposition1 + " OU " + data.proposition2,
      proposition1: data.proposition1,
      proposition2: data.proposition2,
      vote1: 0,
      vote2: 0,
      timeleft: 31,
    };

    var time = actualPoll.timeleft;

    io.emit('pollStarted');

    function handle() {

      actualPoll.timeleft--;
      io.emit('initData', { actualPoll: actualPoll, nbPlayers: nbPlayers });

      if(actualPoll.timeleft > 0){
        setTimeout(handle, 1000);
      }
      else{
        let response = (actualPoll.vote1 == actualPoll.vote2 ? "Égalité des votes" : 
        (actualPoll.vote1 > actualPoll.vote2 ? "Le choix '" + actualPoll.proposition1 + "' à été voté." : "Le choix '" + actualPoll.proposition2 + "' à été voté." ))
        io.emit('result', response);

        actualPoll = null;
      }
    }
    setTimeout(handle, 1000);
  });

  socket.on('retrieveData', () => {
    io.emit('initData', { actualPoll: actualPoll, nbPlayers: nbPlayers });
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});