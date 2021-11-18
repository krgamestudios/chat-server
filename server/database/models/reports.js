const Sequelize = require('sequelize');
const sequelize = require('..');

module.exports = sequelize.define('reports', {
	index: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		autoIncrement: true,
		primaryKey: true,
		unique: true
	},

	reporter: {
		type: 'varchar(320)',
		allowNull: false
	},
});
