const chatlog = require('./chatlog');
const mute = require('./mute');
const reports = require('./reports');

//relationships
reports.belongsTo(chatlog);

module.exports = {
	chatlog,
	mute,
	reports,
};
