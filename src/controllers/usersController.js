const User = require('../models/User');

async function listUsers(req, res, next) {
  try {
    const users = await User.find({}, { __v: 0 }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: users });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
};
