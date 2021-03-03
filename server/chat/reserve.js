const crypto = require("crypto");

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { pseudonyms } = require('../database/models');

const route = async (req, res) => {
	//check the key
	if (req.fields.key != process.env.CHAT_KEY) {
		return res.status(403).send('Invalid chat key');
	}

	//generate a UUID to act as a pseudonym (starting with a period)
	const pseudonym = `.${uuid()}`;

	//find or create the record (using the username)
	const [instance, created] = await pseudonyms.findOrCreate({
		where: {
			username: req.fields.username
		}
	});

	//save the pseudonym (overwriting existing pseudonyms)
	const result = await pseudonyms.update({
		pseudonym: pseudonym
	},{
		where: {
			username: instance.username
		}
	});

	//OK
	return res.status(200).send({ pseudonym: pseudonym });
};

//lazy
const uuid = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

module.exports = route;