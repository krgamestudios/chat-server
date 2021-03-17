const jwt = require('jsonwebtoken');
const { chatlog } = require('../database/models');
const { Op } = require('sequelize');

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

			//log
			chatlog.create({
				username: socket.user.username,
				text: `${socket.user.username} entered chat`,
				room: socket.user.room,
				emphasis: true
			});

			//send backlog to the user
			chatlog.findAll({
				where: {
					room: {
						[Op.eq]: socket.user.room
					}
				},
				order: [
					['id', 'ASC']
				],
				limit: 50
			})
				.then(rows => rows.map(row => row.dataValues))
				.then(rows => rows.filter(row => {
					//emphasis and strong don't use usernames
					return !(row.emphasis || row.strong);
				}))
				.then(rows => socket.emit('backlog', rows))
				.then(() => {
					//send a # to the user
					const count = io.sockets.size;
					socket.emit('message', { emphasis: true, text: count == 1 ? `${count} person in the chat` : `${count} people in the chat` });
				})
			;
		});

		socket.on('message', message => {
			//server commands begin with a '/'
			if (message.text.startsWith('/')) {
				return executeCommand(socket, message.text);
			}

			//broadcast to this room
			socket.broadcast.to(socket.user.room).emit('message', { username: socket.user.username, text: message.text });

			//log
			chatlog.create({
				username: socket.user.username,
				text: message.text,
				room: socket.user.room
			});
		});

		socket.on('disconnect', reason => {
			//broadcast to this room
			if (!socket.user) {
				return;
			}

			socket.broadcast.to(socket.user.room || '.error').emit('message', { emphasis: true, text: `${socket.user.username} left chat` });

			//log
			chatlog.create({
				username: socket.user.username,
				text: `${socket.user.username} left chat`,
				room: socket.user.room,
				emphasis: true
			});
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
			socket.broadcast.to(socket.user.room).emit('message', { emphasis: true, text: `${socket.user.username} left the room (going to ${room})` });

			//log
			chatlog.create({
				username: socket.user.username,
				text: `${socket.user.username} left the room`,
				room: socket.user.room,
				emphasis: true
			});

			//move
			socket.leave(socket.user.room);
			socket.user.room = room;
			socket.join(socket.user.room);

			//broadcast to the new room
			socket.broadcast.to(socket.user.room).emit('message', { emphasis: true, text: `${socket.user.username} entered the room` });

			//log
			chatlog.create({
				username: socket.user.username,
				text: `${socket.user.username} entered the room`,
				room: socket.user.room,
				emphasis: true
			});

			//update the user
			socket.emit('message', { emphasis: true, text: `Entered room ${socket.user.room}` });
			break;

		default:
			socket.emit('message', { emphasis: true, text: 'Unknown command' });
	}
};

module.exports = chat;

//TODO: add banning and muting controls
