const ExpenseLimit = require('../models/ExpenseLimit');

function parseMonthKey(value) {
  const monthKey = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const [y, m] = monthKey.split('-').map((n) => Number(n));
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;

  return { monthKey };
}

async function upsertExpenseLimit(req, res, next) {
  try {
    const parsed = parseMonthKey(req.params.monthKey);
    if (!parsed) {
      return res
        .status(400)
        .json({ ok: false, error: 'Invalid monthKey. Use YYYY-MM.' });
    }

    const numLimit = Number(req.body?.limit);
    if (!Number.isFinite(numLimit) || numLimit < 0) {
      return res.status(400).json({ ok: false, error: 'Limit must be >= 0' });
    }

    const doc = await ExpenseLimit.findOneAndUpdate(
      { monthKey: parsed.monthKey },
      { $set: { limit: numLimit } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({ ok: true, data: doc });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  upsertExpenseLimit,
};
