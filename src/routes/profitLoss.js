const express = require('express');

const { getProfitLossSummary } = require('../controllers/profitLossController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

// GET /api/profit-loss?month=YYYY-MM
router.get('/', getProfitLossSummary);

module.exports = router;
