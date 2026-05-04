const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const SalaryTransaction = require('../models/SalaryTransaction');

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

async function createSalaryTransaction(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid employee id' });
    }

    const amount = toNumber(req.body?.amount, NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, error: 'Amount must be greater than 0' });
    }

    const date = toDate(req.body?.date) || new Date();
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

    const employee = await Employee.findById(id).lean();
    if (!employee) {
      return res.status(404).json({ ok: false, error: 'Employee not found' });
    }

    const created = await SalaryTransaction.create({
      employeeId: id,
      amount,
      date,
      note,
    });

    const tx = await SalaryTransaction.findById(created._id, { __v: 0 }).lean();
    return res.status(201).json({ ok: true, data: tx });
  } catch (err) {
    next(err);
  }
}

async function listSalaryTransactions(req, res, next) {
  try {
    const employeeId = (req.query?.employeeId || '').toString().trim();
    if (!employeeId) {
      return res.status(400).json({ ok: false, error: 'Provide employeeId' });
    }
    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ ok: false, error: 'Invalid employeeId' });
    }

    const match = { employeeId: new mongoose.Types.ObjectId(employeeId) };

    const tx = await SalaryTransaction.aggregate([
      { $match: match },
      { $sort: { date: -1, createdAt: -1 } },
      {
        $project: {
          employeeId: 1,
          amount: 1,
          date: 1,
          note: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.json({ ok: true, data: tx });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSalaryTransaction,
  listSalaryTransactions,
};
