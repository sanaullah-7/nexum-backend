const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const ExpenseLimit = require('../models/ExpenseLimit');

function parseMonthKey(value) {
  const monthKey = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const [y, m] = monthKey.split('-').map((n) => Number(n));
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { monthKey, start, end };
}

function currentMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function getProfitLossSummary(req, res, next) {
  try {
    const monthKey = req.query.month || currentMonthKey();
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      return res
        .status(400)
        .json({ ok: false, error: 'Invalid month. Use YYYY-MM.' });
    }

    const [incomeAgg, expensesAgg, limitDoc] = await Promise.all([
      Transaction.aggregate([
        { $match: { date: { $gte: parsed.start, $lt: parsed.end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: parsed.start, $lt: parsed.end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ExpenseLimit.findOne({ monthKey: parsed.monthKey }).lean(),
    ]);

    const income = Number(incomeAgg?.[0]?.total || 0);
    const expenses = Number(expensesAgg?.[0]?.total || 0);
    const limit = limitDoc?.limit ?? 0;

    return res.json({
      ok: true,
      data: {
        monthKey: parsed.monthKey,
        income,
        expenses,
        net: income - expenses,
        expenseLimit: limit,
        remainingLimit: Math.max(0, Number(limit) - expenses),
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfitLossSummary,
};
