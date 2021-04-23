const Sequelize = require('sequelize');
const sequelize = require('..');

const chatlog = require('./chatlog');

const reports = sequelize.define('reports', {
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

chatlog.hasMany(reports, { foreignKey: 'chatlogIndex', foreignKeyConstraint: true });
reports.belongsTo(chatlog, { foreignKey: 'chatlogIndex' });

sequelize.sync();

module.exports = reports;