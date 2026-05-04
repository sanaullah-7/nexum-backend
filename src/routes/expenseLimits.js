const express = require('express');

const { upsertExpenseLimit } = require('../controllers/expenseLimitsController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

// PUT /api/expense-limits/:monthKey
router.put('/:monthKey', upsertExpenseLimit);

module.exports = router;
