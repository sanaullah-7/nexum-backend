const express = require('express');

const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
} = require('../controllers/projectsController');

const { createTransaction } = require('../controllers/transactionsController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.put('/:id', updateProject);
router.put('/:id/status', updateProjectStatus);
router.delete('/:id', deleteProject);

router.post('/:id/transactions', createTransaction);

module.exports = router;
