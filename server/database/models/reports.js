const Sequelize = require('sequelize');
const sequelize = require('..');

const chatlog = require('./chatlog');

const reports = sequelize.define('reports', {
	id: {
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

chatlog.hasMany(reports, { foreignKey: 'chatlogId', foreignKeyConstraint: true });
reports.belongsTo(chatlog, { foreignKey: 'chatlogId' });

module.exports = reports;