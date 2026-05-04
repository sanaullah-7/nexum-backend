const express = require('express');

const { listTransactions } = require('../controllers/transactionsController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

// GET /api/transactions?projectId=... OR /api/transactions?clientId=...
router.get('/', listTransactions);

module.exports = router;
