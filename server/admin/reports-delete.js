const { chatlog, reports } = require('../database/models');

//admin/reports
const route = async (req, res) => {
	const reps = await reports.destroy({
		where: {
			chatlogId: req.body.chatlogId
		}
	});

	//respond
	res.status(200).end();
};

module.exports = route;