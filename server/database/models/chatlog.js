const Sequelize = require('sequelize');
const sequelize = require('..');

module.exports = sequelize.define('chatlog', {
	id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		autoIncrement: true,
		primaryKey: true,
		unique: true
	},

	notification: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},

	username: {
		type: 'varchar(320)',
		allowNull: false
	},

	text: {
		type: Sequelize.TEXT,
		allowNull: false,
	},

	room: {
		type: Sequelize.TEXT,
		allowNull: false
	},

	emphasis: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},

	strong: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});
