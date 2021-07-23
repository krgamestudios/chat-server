const { chatlog, reports } = require('../database/models');

//admin/reports
const route = async (req, res) => {
	const reps = await reports.destroy({
		where: {
			chatlogIndex: req.body.chatlogIndex
		}
	});

	//respond
	res.status(200).end();
};

module.exports = route;