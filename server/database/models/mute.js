const Sequelize = require('sequelize');
const sequelize = require('..');

module.exports = sequelize.define('mute', {
	username: {
		type: 'varchar(320)',
		allowNull: false,
		unique: true
	},

	until: {
		type: 'DATETIME',
		allowNull: false
	},

	reason: {
		type: Sequelize.TEXT,
		allowNull: true,
	}
});
