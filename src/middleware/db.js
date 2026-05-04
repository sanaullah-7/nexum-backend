const mongoose = require('mongoose');

function requireDb(req, res, next) {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    ok: false,
    error: 'Database unavailable',
  });
}

module.exports = {
  requireDb,
};
