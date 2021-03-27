const { chatlog, reports } = require('../database/models');

//admin/reports
const route = async (req, res) => {
	const reps = await reports.findAll({
		include: [{
			model: chatlog,
			required: true
		}],
		order: ['chatlogId']
	});

	//collate
	const response = [];
	for(let i = 0; i < reps.length; i++) {
		//new chatlog
		if (response.length == 0 || response[response.length - 1].chatlogId != reps[i].chatlogId) {
			response.push(reps[i]);
			response[response.length - 1].reporter = [response[response.length - 1].reporter]; //reporters in an array
			continue;
		}

		//multiple people reported this, add to the existing array
		response[response.length - 1].reporter.push(reps[i].reporter);
	}

	//respond
	res.status(200).json(response);
};

module.exports = route;