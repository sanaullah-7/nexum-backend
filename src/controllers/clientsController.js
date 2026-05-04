const mongoose = require('mongoose');
const Client = require('../models/Client');

function buildClientPaymentsPipeline(matchStage) {
  const pipeline = [];
  if (matchStage) pipeline.push(matchStage);

  pipeline.push(
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: 'clientId',
        as: 'projects',
      },
    },
    {
      $addFields: {
        totalPayment: {
          $ifNull: [{ $sum: '$projects.amount' }, 0],
        },
      },
    },
    {
      $lookup: {
        from: 'transactions',
        let: { projectIds: '$projects._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$projectId', { $ifNull: ['$$projectIds', []] }],
              },
            },
          },
          { $group: { _id: null, clearedAmount: { $sum: '$amount' } } },
        ],
        as: 'txAgg',
      },
    },
    {
      $addFields: {
        clearedAmount: {
          $ifNull: [{ $arrayElemAt: ['$txAgg.clearedAmount', 0] }, 0],
        },
      },
    },
    {
      $project: {
        __v: 0,
        projects: 0,
        txAgg: 0,
      },
    },
  );

  return pipeline;
}

function toNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickClientPayload(body) {
  return {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    country: typeof body?.country === 'string' ? body.country.trim() : '',

    totalProjects: toNumber(body?.totalProjects, 0),
    completedProjects: toNumber(body?.completedProjects, 0),
    runningProjects: toNumber(body?.runningProjects, 0),

    contactEmail: typeof body?.contactEmail === 'string' ? body.contactEmail.trim().toLowerCase() : '',
    contactPhone: typeof body?.contactPhone === 'string' ? body.contactPhone.trim() : '',
  };
}

async function listClients(req, res, next) {
  try {
    const clients = await Client.aggregate([
      { $sort: { createdAt: -1 } },
      ...buildClientPaymentsPipeline(),
    ]);
    res.json({ ok: true, data: clients });
  } catch (err) {
    next(err);
  }
}

async function getClient(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const clientId = new mongoose.Types.ObjectId(id);
    const [client] = await Client.aggregate([
      { $match: { _id: clientId } },
      ...buildClientPaymentsPipeline(),
    ]);

    if (!client) {
      return res.status(404).json({ ok: false, error: 'Client not found' });
    }

    return res.json({ ok: true, data: client });
  } catch (err) {
    next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const payload = pickClientPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ ok: false, error: 'Client name is required' });
    }

    const created = await Client.create(payload);
    const client = await Client.findById(created._id, { __v: 0 }).lean();
    return res.status(201).json({ ok: true, data: client });
  } catch (err) {
    next(err);
  }
}

async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const payload = pickClientPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ ok: false, error: 'Client name is required' });
    }

    const updated = await Client.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      projection: { __v: 0 },
    }).lean();

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Client not found' });
    }

    return res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const deleted = await Client.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Client not found' });
    }

    return res.json({ ok: true, data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
};
