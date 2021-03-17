//environment variables
require('dotenv').config();

//create the server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
	cors: {
		origin: '*'
	}
});
const bodyParser = require('body-parser');
const cors = require('cors');

//config
app.use(bodyParser.json());
app.use(cors());

//database connection
const database = require('./database');

//access the chat
require('./chat')(io.of('/chat'));

//error on access
app.get('*', (req, res) => {
	res.redirect('https://github.com/krgamestudios/chat-server');
});

//startup
server.listen(process.env.WEB_PORT || 3300, async (err) => {
	await database.sync();
	console.log(`listening to localhost:${process.env.WEB_PORT || 3300}`);
});
