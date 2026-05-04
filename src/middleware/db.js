const mongoose = require('mongoose');

const { ensureDbConnected } = require('../config/db');

async function requireDb(req, res, next) {
  try {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(process.env.MONGODB_URI);
    }

    if (mongoose.connection.readyState === 1) {
      return next();
    }

    return res.status(503).json({
      ok: false,
      error: 'Database unavailable',
    });
  } catch (err) {
    const message = err?.message || 'Database unavailable';
    const isMissingUri = message.includes('Missing MONGODB_URI');
    return res.status(isMissingUri ? 500 : 503).json({
      ok: false,
      error: message,
    });
  }
}

module.exports = {
  requireDb,
};
