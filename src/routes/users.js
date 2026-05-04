const express = require('express');

const { listUsers } = require('../controllers/usersController');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireDb);

router.get('/', listUsers);

module.exports = router;
