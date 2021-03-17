const { request } = require('express');
const jwt = require('jsonwebtoken');

const chat = io => {
	io.on('connection', socket => {
		//middleware
		socket.use((request, next) => {
			//verify request format
			if (!['open chat', 'message'].includes(request[0])) {
				return next(`Invalid request to the chat server ${request[0]}`);
			}
			return next();
		});

		socket.use((request, next) => {
			//authenticate the jwt
			return jwt.verify(request[1].accessToken, process.env.SECRET_ACCESS, (err, user) => {
				if (err) {
					return next(err);
				}

				const room = socket.user?.room; //save room, if any
				socket.user = user;
				socket.user.room = room;

				return next();
			});
		});

		//handle errors
		socket.on('error', err => {
			console.log('socket error:', err);
			socket.emit(err);
		});

		//from here, handles all normal messages
		socket.on('open chat', message => {
			//handle rooms - only in a room if you've opened chat
			const newlyOpened = !socket.user.room;
			socket.user.room = socket.user.room || 'general'; //default to general

			if (!newlyOpened) {
				return;
			}

			socket.join(socket.user.room);

			//broadcast to this room
			socket.broadcast.to(socket.user.room).emit('message', { emphasis: true, text: `${socket.user.username} entered chat` });
		});

		socket.on('message', message => {
			//server commands begin with a '/'
			if (message.text.startsWith('/')) {
				return executeCommand(socket, message.text);
			}

			//broadcast to this room
			socket.broadcast.to(socket.user.room).emit('message', { username: socket.user.username, text: message.text });
		});

		socket.on('disconnect', reason => {
			//broadcast to this room
			if (!socket.user) {
				return;
			}

			socket.broadcast.to(socket.user.room || '.error').emit('message', { emphasis: true, text: `${socket.user.username} left chat` });
		});
	});
};

//handle commands
const executeCommand = (socket, command) => {
	switch(command.split(' ')[0]) {
		case '/room':
			const room = command.split(' ')[1];

			if (!room) {
				socket.emit('no room argument');
				break;
			}

			//broadcast to the old room
			socket.broadcast.to(socket.user.room).emit('message', { emphasis: true, text: `${socket.user.username} left chat` });

			socket.leave(socket.user.room);
			socket.user.room = room;
			socket.join(socket.user.room);

			//broadcast to the new room
			socket.broadcast.to(socket.user.room).emit('message', { emphasis: true, text: `${socket.user.username} entered chat` });
			socket.emit('message', { emphasis: true, text: `Entered room ${socket.user.room}` });
			break;

		default:
			socket.emit('message', { emphasis: true, text: 'Unknown command' });
	}
};

module.exports = chat;

//TODO: record messages in a database
//TODO: handle message backlog on connection
//TODO: add banning and muting controls
