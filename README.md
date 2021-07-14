# chat-server

An API centric chat server. Uses Sequelize and mariaDB by default.

# Setup

There are multiple ways to run this app - it can run on it's own via `npm start` (for production) or `npm run dev` (for development). it can also run inside docker using `docker-compose up --build` - run `node configure-script.js` to generate docker-compose.yml and startup.sql.

# API

This server uses socket.io for communication. Be aware that every chat message requires a valid JWT. See the [auth-server](https://github.com/krgamestudios/auth-server) for details.

The event types are as follows:

```
Server:
on 'connection' -> Server waits for "open chat" event to continue
on 'error' -> Server emits and logs an error
on 'open chat' -> Preps the server for your messages, places you in the room 'general'
on 'message' -> Server broadcasts to all other users in your room
on 'disconnect' -> Server will no longer accept your messages
on 'report' -> Report the chatlog with the index 'id'


Chat Commands:
/room name -> Move to the room "name"
/mute username minutes [reason] -> Mutes a specified user for X minutes; only available to admins or mods
/unmute username - Unmutes the previously muted user; only available to admins or mods
```
