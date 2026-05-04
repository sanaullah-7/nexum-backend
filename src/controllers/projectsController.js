const mongoose = require('mongoose');
const Project = require('../models/Project');

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

function pickProjectPayload(body) {
  const status = typeof body?.status === 'string' ? body.status : '';
  const safeStatus = ['pending', 'processing', 'completed'].includes(status)
    ? status
    : undefined;

  return {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    clientId: body?.clientId,
    status: safeStatus,
    amount: toNumber(body?.amount, 0),
    startDate: toDate(body?.startDate),
    deadline: toDate(body?.deadline),
  };
}

async function listProjects(req, res, next) {
  try {
    const status = (req.query?.status || '').toString().trim();
    const clientId = (req.query?.clientId || '').toString().trim();
    const match = {};
    if (['pending', 'processing', 'completed'].includes(status)) {
      match.status = status;
    }
    if (clientId && mongoose.isValidObjectId(clientId)) {
      match.clientId = new mongoose.Types.ObjectId(clientId);
    }

    const projects = await Project.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'transactions',
          let: { projectId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$projectId', '$$projectId'] } } },
            { $group: { _id: null, clearedAmount: { $sum: '$amount' } } },
          ],
          as: 'tx',
        },
      },
      {
        $addFields: {
          clearedAmount: {
            $ifNull: [{ $arrayElemAt: ['$tx.clearedAmount', 0] }, 0],
          },
        },
      },
      {
        $addFields: {
          remainingAmount: {
            $max: [{ $subtract: ['$amount', '$clearedAmount'] }, 0],
          },
        },
      },
      {
        $project: {
          __v: 0,
          tx: 0,
          client: { __v: 0 },
        },
      },
    ]);

    res.json({ ok: true, data: projects });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const projectId = new mongoose.Types.ObjectId(id);

    const [project] = await Project.aggregate([
      { $match: { _id: projectId } },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'transactions',
          let: { projectId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$projectId', '$$projectId'] } } },
            { $group: { _id: null, clearedAmount: { $sum: '$amount' } } },
          ],
          as: 'tx',
        },
      },
      {
        $addFields: {
          clearedAmount: {
            $ifNull: [{ $arrayElemAt: ['$tx.clearedAmount', 0] }, 0],
          },
        },
      },
      {
        $addFields: {
          remainingAmount: {
            $max: [{ $subtract: ['$amount', '$clearedAmount'] }, 0],
          },
        },
      },
      {
        $project: {
          __v: 0,
          tx: 0,
          client: { __v: 0 },
        },
      },
    ]);

    if (!project) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    return res.json({ ok: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const payload = pickProjectPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ ok: false, error: 'Project name is required' });
    }

    if (!mongoose.isValidObjectId(payload.clientId)) {
      return res.status(400).json({ ok: false, error: 'Valid clientId is required' });
    }

    if (!Number.isFinite(payload.amount) || payload.amount < 0) {
      return res.status(400).json({ ok: false, error: 'Amount must be a non-negative number' });
    }

    const created = await Project.create({
      name: payload.name,
      clientId: payload.clientId,
      status: payload.status || 'pending',
      amount: payload.amount,
      startDate: payload.startDate,
      deadline: payload.deadline,
    });

    const [project] = await Project.aggregate([
      { $match: { _id: created._id } },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      { $addFields: { clearedAmount: 0, remainingAmount: '$amount' } },
      { $project: { __v: 0, client: { __v: 0 } } },
    ]);

    return res.status(201).json({ ok: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const payload = pickProjectPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ ok: false, error: 'Project name is required' });
    }

    if (!mongoose.isValidObjectId(payload.clientId)) {
      return res.status(400).json({ ok: false, error: 'Valid clientId is required' });
    }

    if (!Number.isFinite(payload.amount) || payload.amount < 0) {
      return res.status(400).json({ ok: false, error: 'Amount must be a non-negative number' });
    }

    const safeUpdate = {
      name: payload.name,
      clientId: payload.clientId,
      status: payload.status || 'pending',
      amount: payload.amount,
      startDate: payload.startDate,
      deadline: payload.deadline,
    };

    const updated = await Project.findByIdAndUpdate(id, safeUpdate, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    return res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const deleted = await Project.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    return res.json({ ok: true, data: { id } });
  } catch (err) {
    next(err);
  }
}

async function updateProjectStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const status = (req.body?.status || '').toString().trim();
    if (!['pending', 'processing', 'completed'].includes(status)) {
      return res
        .status(400)
        .json({ ok: false, error: 'Status must be pending, processing, or completed' });
    }

    const updated = await Project.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    return res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};
