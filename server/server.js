//environment variables
require('dotenv').config();

//create the server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const formidable = require('express-formidable');
const bodyParser = require('body-parser');
const cors = require('cors');

//config
app.use(formidable());
app.use(bodyParser.json());
app.use(cors());

//database connection
const database = require('./database');

//access the news
app.use('/chat', require('./chat'));

//error on access
app.get('*', (req, res) => {
	res.redirect('https://github.com/krgamestudios/chat-server');
});

//startup
server.listen(process.env.WEB_PORT || 3200, (err) => {
	console.log(`listening to localhost:${process.env.WEB_PORT || 3200}`);
});
