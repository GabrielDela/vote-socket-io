const { Socket } = require('engine.io');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/poll', (req, res) => {
    res.sendFile(__dirname + '/poll.html');
});

var sessions = [];

var nbConnected = 0;
io.on('connection', (socket) => {
    nbConnected++;
    io.emit('nbConnected', nbConnected);

    socket.on('disconnect', () => {
        nbConnected--;

        if (socket.player != null) {
            const session = sessions.find(element => element.sessionID == socket.player.sessionID);
            if (session != null) {
                const index = session.players.indexOf(socket.player);
                if (index > -1) {
                    session.players.splice(index, 1);
                }
                socket.leave(session.sessionID);
                io.to(session.sessionID).emit('data_loader', session);
            } else {
                socket.emit('error', 'Aucune session avec cet identifiant !')
            }

            if (socket.player.owner) {
                if (session) {

                    io.to(session.sessionID).emit('deleted_session');
                    const index = sessions.indexOf(session);
                    if (index > -1) {
                        sessions.splice(index, 1);
                    }
                }
            }
        }

        io.emit('nbConnected', nbConnected);
    });

    socket.on('leave', () => {
        if (socket.player != null) {
            const session = sessions.find(element => element.sessionID == socket.player.sessionID);

            if (session != null) {
                const index = session.players.indexOf(socket.player);
                if (index > -1) {
                    session.players.splice(index, 1);
                }
                socket.leave(session.sessionID);
                io.to(session.sessionID).emit('data_loader', session);
            } else {
                socket.emit('error', 'Aucune session avec cet identifiant !')
            }
        }

        io.emit('nbConnected', nbConnected);
    });

    socket.on('join', data => {
        const session = sessions.find(element => element.sessionID == data.sessionID);
        if (session) {
            socket.player = {
                socketID: socket.id,
                username: data.username,
                sessionID: data.sessionID,
                client_UUID: data.client_UUID,
            }

            session.players.push(socket.player);
            socket.join(session.sessionID);
            socket.emit('joined', session.sessionID);
            io.to(session.sessionID).emit('data_loader', session);
        } else {
            socket.emit('error', 'Aucune session avec cet identifiant !')
        }
    });

    socket.on('vote', (type) => {
        const session = sessions.find(element => element.sessionID == socket.player.sessionID);
        if (session) {
            const vote = session.votes.find(element => element.client_UUID == socket.player.client_UUID);
            if (!vote) {
                session.votes.push({ client_UUID: socket.player.client_UUID });
                type == 1 ? session.vote1++ : session.vote2++;
                io.to(session.sessionID).emit('data_loader', session);
            }
        }
    });

    socket.on('create_poll', (data) => {
        if (data != null) {
            var session = {
                sessionID: data.sessionID,
                players: [],
                question: data.question,
                proposition1: data.vote1,
                proposition2: data.vote2,
                vote1: 0,
                vote2: 0,
                timeleft: 30,
                votes: [],
                admin: data.client_UUID
            };

            sessions.push(session);

            socket.player = {
                socketID: socket.id,
                username: "Admin",
                owner: true,
                sessionID: data.sessionID,
                client_UUID: data.client_UUID,
            }

            session.players.push(socket.player);
            socket.join(session.sessionID);

            socket.emit('joined', session.sessionID);
            io.to(session.sessionID).emit('data_loader', session);

            function handle() {
                session.timeleft--;
                io.to(session.sessionID).emit('data_loader', session);

                if (session.timeleft > 0) {
                    setTimeout(handle, 1000);
                } else {
                    let response = (session.vote1 == session.vote2 ? "Égalité des votes" :
                        (session.vote1 > session.vote2 ? "Le choix '" + session.proposition1 + "' à été voté." : "Le choix '" + session.proposition2 + "' à été voté."))
                    io.to(session.sessionID).emit('result', response);

                    session = null;
                }
            }
            setTimeout(handle, 1000);

        }
    });

    socket.on('delete', (sessionID) => {
        io.to(sessionID).emit('deleted_session');

        const session = sessions.find(element => element.sessionID == sessionID);
        if (session) {
            const index = sessions.indexOf(session);
            if (index > -1) {
                sessions.splice(index, 1);
            }
        }
    });

    socket.on('deleted_session', (sessionID) => {
        socket.leave(sessionID);
    });
});

server.listen(process.env.PORT || 5000, () => {
    console.log('listening on *:' + process.env.PORT || 5000);
});