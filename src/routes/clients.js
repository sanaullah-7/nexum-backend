const express = require('express');

const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientsController');

const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/db');

const router = express.Router();

router.use(requireAuth);
router.use(requireDb);

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
