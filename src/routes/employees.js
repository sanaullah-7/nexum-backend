const express = require('express');

const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeesController');

const { createSalaryTransaction } = require('../controllers/salaryTransactionsController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

router.post('/:id/salary-transactions', createSalaryTransaction);

module.exports = router;
