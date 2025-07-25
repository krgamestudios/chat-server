//environment variables
require('dotenv').config();

//create the server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
	cors: {
		origin: process.env.WEB_ORIGIN
	}
});
const cors = require('cors');

//config
app.use(express.json());
app.use(cors({
	credentials: true,
	origin: [`${process.env.WEB_ORIGIN}`], //because auth-server
	allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Set-Cookie'],
	exposedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Set-Cookie'],
}));

//database connection
const database = require('./database');

//admin stuff
app.use('/admin', require('./admin'));

//access the chat
require('./chat')(io.of('/chat'));

//error on access
app.get('/{*any}', (req, res) => {
	res.redirect('https://github.com/krgamestudios/chat-server');
});

//startup
server.listen(process.env.WEB_PORT || 3300, async (err) => {
	await database.sync();
	console.log(`listening to localhost:${process.env.WEB_PORT || 3300}`);
	console.log(`database located at ${process.env.DB_HOSTNAME || '<default>'}:${process.env.DB_PORTNAME || '<default>'}`);
});
