const Sequelize = require('sequelize');
const sequelize = require('..');

module.exports = sequelize.define('pseudonyms', {
	id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		autoIncrement: true,
		primaryKey: true,
		unique: true
	},

	username: {
		type: 'varchar(320)',
		unique: true
	},

	pseudonym: {
		type: 'varchar(320)',
		unique: true
	},

	deletion: {
		type: 'DATETIME',
		allowNull: true,
		defaultValue: null
	}
});
