#use this while debugging
CREATE DATABASE IF NOT EXISTS chat;
CREATE USER IF NOT EXISTS 'chat'@'%' IDENTIFIED BY 'blastoise';
GRANT ALL PRIVILEGES ON chat.* TO 'chat'@'%';
