#use this while debugging
CREATE DATABASE chat;
CREATE USER 'chat'@'%' IDENTIFIED BY 'blastoise';
GRANT ALL PRIVILEGES ON chat.* TO 'chat'@'%';
