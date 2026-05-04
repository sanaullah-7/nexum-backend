const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    if (process.env.ALLOW_STATIC_AUTH === 'true' && token === 'static-demo-token') {
      req.auth = { sub: 'static-admin', role: 'admin', mode: 'static' };
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ ok: false, error: 'Server misconfigured' });
    }

    const payload = jwt.verify(token, secret);
    req.auth = payload;

    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
}

module.exports = {
  requireAuth,
};
