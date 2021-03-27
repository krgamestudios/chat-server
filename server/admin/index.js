const express = require('express');
const router = express.Router();

//middleware
const tokenAuth = require('../utilities/token-auth');

router.use(tokenAuth);
router.use((req, res, next) => {
	//check the user's admin status
	if (!req.user.mod) {
		return res.status(401).send('Mods only');
	}

	next();
});

//basic route management
router.get('/reports', require('./reports'));
router.delete('/reports', require('./reports-delete'));

module.exports = router;