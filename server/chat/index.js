const express = require('express');
const router = express.Router();

//reserve the name using a pseudonym
router.post('/reserve', require('./reserve'));

module.exports = router;
