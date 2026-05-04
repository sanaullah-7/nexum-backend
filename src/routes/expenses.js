const express = require('express');

const {
  listExpenses,
  createExpense,
  deleteExpense,
} = require('../controllers/expensesController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

// GET /api/expenses?month=YYYY-MM
router.get('/', listExpenses);

// POST /api/expenses
router.post('/', createExpense);

// DELETE /api/expenses/:id
router.delete('/:id', deleteExpense);

module.exports = router;
