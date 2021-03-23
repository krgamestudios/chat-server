const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { chatlog, mute, reports } = require('../database/models');

const chat = io => {
	io.on('connection', socket => {
		//middleware
		socket.use((request, next) => {
			//verify request format
			if (!['open chat', 'message', 'report'].includes(request[0])) {
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
				notification: true,
				username: socket.user.username,
				text: `${socket.user.username} entered chat`,
				room: socket.user.room,
				emphasis: true
			});

			//send backlog to the user
			chatlog.findAll({
				where: {
					room: {
						[Op.eq]: socket.user.room,
					},
					strong: {
						[Op.ne]: true
					},
					emphasis: {
						[Op.ne]: true
					}
				},
				order: [
					['id', 'DESC']
				],
				limit: 50
			})
				.then(rows => rows.map(row => row.dataValues))
				.then(rows => rows.reverse())
				.then(rows => socket.emit('backlog', rows))
				.then(() => {
					//send a # to the user
					const count = io.sockets.size;
					socket.emit('message', { emphasis: true, text: count == 1 ? `${count} person in the chat` : `${count} people in the chat` });
				})
			;
		});

		socket.on('message', async message => {
			//server commands begin with a '/'
			if (message.text.startsWith('/')) {
				return executeCommand(io, socket, message.text);
			}

			const record = await mute.findOne({
				where: {
					username: {
						[Op.eq]: socket.user.username
					},
					until: {
						[Op.gt]: new Date(Date.now())
					}
				}
			});

			if (record) {
				socket.emit('message', { emphasis: true, text: 'You are currently muted' });
				return;
			}

			//log
			const log = await chatlog.create({
				username: socket.user.username,
				text: message.text,
				room: socket.user.room
			});

			//broadcast to this room (with the id)
			socket.broadcast.to(socket.user.room).emit('message', log);
		});

		socket.on('disconnect', reason => {
			//broadcast to this room
			if (!socket.user) {
				return;
			}

			socket.broadcast.to(socket.user.room || '.error').emit('message', { emphasis: true, text: `${socket.user.username} left chat` });

			//log
			chatlog.create({
				notification: true,
				username: socket.user.username,
				text: `${socket.user.username} left chat`,
				room: socket.user.room,
				emphasis: true
			});
		});

		socket.on('report', info => {
			//handle reports of malicious content
			if (!info.id) {
				return;
			}

			//report
			reports.create({
				reporter: socket.user.username,
				chatlogId: info.id
			});
		});
	});
};

//handle commands
const executeCommand = (io, socket, command) => {
	switch(command.split(' ')[0]) {
		case '/room': {
			const room = command.split(' ')[1];

			if (!room) {
				socket.emit('no room argument');
				break;
			}

			//broadcast to the old room
			socket.broadcast.to(socket.user.room).emit('message', { emphasis: true, text: `${socket.user.username} left the room (going to ${room})` });

			//log
			chatlog.create({
				notification: true,
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
				notification: true,
				username: socket.user.username,
				text: `${socket.user.username} entered the room`,
				room: socket.user.room,
				emphasis: true
			});

			//update the user
			socket.emit('message', { emphasis: true, text: `Entered room ${socket.user.room}` });
			break;
		}

		case '/mute': {//NOTE: mutes globally, broadcasts only to admin's room
			if (!socket.user.admin && !socket.user.mod) {
				socket.emit('message', { emphasis: true, text: '/mute is only available to admins and mods' });
				break;
			}

			const arr = command.split(' ');
			arr.shift(); // /mute
			const username = arr.shift();
			const minutes = parseInt(arr.shift());
			const reason = arr.join(' ');

			//check valid command
			if (!username || !minutes || typeof minutes !== 'number' || minutes < 1) {
				socket.emit('message', { emphasis: true, text: `format: /mute username minutes [reason]` });
				break;
			}

			//upsert
			const interval = new Date((new Date()).setMinutes((new Date()).getMinutes() + minutes)); //wow

			mute.upsert({
				username: username,
				until: interval,
				reason: reason
			});

			//broadcast
			io.to(socket.user.room).emit('message', { strong: true, emphasis: true, text: `${username} has been muted for ${minutes} minute${minutes != 1 ? 's' : ''}${reason ? ': ' : ''}${reason}` });

			//log
			chatlog.create({
				notification: true,
				username: socket.user.username,
				text: `${username} has been muted for ${minutes} minute${minutes != 1 ? 's' : ''}: ${reason}`,
				room: socket.user.room,
				strong: true,
				emphasis: true
			});

			break;
		}

		case '/unmute': {
			if (!socket.user.admin && !socket.user.mod) {
				socket.emit('message', { emphasis: true, text: '/unmute is only available to admins and mods' });
				break;
			}

			const arr = command.split(' ');
			arr.shift(); // /mute
			const username = arr.shift();

			const rowCount = mute.destroy({
				where: {
					username: {
						[Op.eq]: username
					},
					until: {
						[Op.gt]: new Date(Date.now())
					}
				}
			});

			if (rowCount == 0) {
				socket.emit('message', { emphasis: true, text: 'That user was not muted' });
				break;
			}

			//broadcast
			io.to(socket.user.room).emit('message', { emphasis: true, text: `${username} has been unmuted` });

			//log
			chatlog.create({
				notification: true,
				username: socket.user.username,
				text: `${username} has been unmuted`,
				room: socket.user.room,
				emphasis: true
			});

			break;
		}

		default: {
			socket.emit('message', { emphasis: true, text: 'Unknown command' });
		}
	}
};

module.exports = chat;
