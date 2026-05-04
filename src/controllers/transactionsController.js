const mongoose = require('mongoose');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');

function toNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

async function createTransaction(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid project id' });
    }

    const amount = toNumber(req.body?.amount, NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, error: 'Amount must be greater than 0' });
    }

    const date = toDate(req.body?.date) || new Date();
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

    const project = await Project.findById(id).lean();
    if (!project) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    const created = await Transaction.create({
      projectId: id,
      amount,
      date,
      note,
    });

    const tx = await Transaction.findById(created._id, { __v: 0 }).lean();
    return res.status(201).json({ ok: true, data: tx });
  } catch (err) {
    next(err);
  }
}

async function listTransactions(req, res, next) {
  try {
    const projectId = (req.query?.projectId || '').toString().trim();
    const clientId = (req.query?.clientId || '').toString().trim();

    if (!projectId && !clientId) {
      return res
        .status(400)
        .json({ ok: false, error: 'Provide projectId or clientId' });
    }

    const match = {};
    if (projectId) {
      if (!mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({ ok: false, error: 'Invalid projectId' });
      }
      match.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const clientObjectId = clientId && mongoose.isValidObjectId(clientId)
      ? new mongoose.Types.ObjectId(clientId)
      : null;

    const pipeline = [
      { $match: match },
      { $sort: { date: -1, createdAt: -1 } },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
    ];

    if (clientId) {
      if (!clientObjectId) {
        return res.status(400).json({ ok: false, error: 'Invalid clientId' });
      }
      pipeline.push({ $match: { 'project.clientId': clientObjectId } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'clients',
          localField: 'project.clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          projectId: 1,
          amount: 1,
          date: 1,
          note: 1,
          createdAt: 1,
          project: {
            _id: '$project._id',
            name: '$project.name',
            status: '$project.status',
            amount: '$project.amount',
            clientId: '$project.clientId',
          },
          client: {
            _id: '$client._id',
            name: '$client.name',
          },
        },
      },
    );

    const tx = await Transaction.aggregate(pipeline);
    return res.json({ ok: true, data: tx });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTransaction,
  listTransactions,
};
