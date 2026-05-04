const Expense = require('../models/Expense');

function toDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

function parseMonthKey(value) {
  const monthKey = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const [y, m] = monthKey.split('-').map((n) => Number(n));
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { monthKey, start, end };
}

async function listExpenses(req, res, next) {
  try {
    const parsed = parseMonthKey(req.query.month);
    if (!parsed) {
      return res
        .status(400)
        .json({ ok: false, error: 'Invalid month. Use YYYY-MM.' });
    }

    const items = await Expense.find(
      { date: { $gte: parsed.start, $lt: parsed.end } },
      { __v: 0 },
    )
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.json({ ok: true, data: items });
  } catch (err) {
    return next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const { title, amount, date, note } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ ok: false, error: 'Title is required' });
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ ok: false, error: 'Amount must be greater than 0' });
    }

    const parsedDate = toDate(date) || new Date();

    const created = await Expense.create({
      title: String(title).trim(),
      amount: numAmount,
      date: parsedDate,
      note: note ? String(note).trim() : undefined,
    });

    const saved = await Expense.findById(created._id, { __v: 0 }).lean();
    return res.status(201).json({ ok: true, data: saved });
  } catch (err) {
    return next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Expense not found' });
    }
    return res.json({ ok: true, data: { id } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listExpenses,
  createExpense,
  deleteExpense,
};
