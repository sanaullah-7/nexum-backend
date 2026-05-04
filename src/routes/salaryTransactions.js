const express = require('express');

const { listSalaryTransactions } = require('../controllers/salaryTransactionsController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

// GET /api/salary-transactions?employeeId=...
router.get('/', listSalaryTransactions);

module.exports = router;
