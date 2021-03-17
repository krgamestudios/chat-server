# chat-server

An API centric chat server. Uses Sequelize and mariaDB by default.

# Setup

TODO: document the chat server setup

# API

TODO: document the chat server api

socket.io


```
on connection -> wait for "create user" event

on create user -> join #general as @username; socket.roomName = 'general'; socket.username = 'username'; accept only JWTs, send "backlog" message

on message -> socket.to(socket.roomName).emit('message'); //scan for commands via middleware

on disconnect -> cleanup etc.

regular user API:
/join #room -> room is set to #room, join and leave commands are issued (this can also "create" new rooms)
/whisper @username -> disallow if roomName is different between two users
```


```
//user count
let room = io.sockets.adapter.rooms['my_room'];
let count = room.length;
```

https://socket.io/docs/v3/middlewares/

