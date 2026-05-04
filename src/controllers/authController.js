const jwt = require('jsonwebtoken');

function parseLoginBody(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  return { email, password };
}

async function login(req, res, next) {
  try {
    const { email, password } = parseLoginBody(req.body);

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ ok: false, error: 'Missing JWT_SECRET' });
    }

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ ok: false, error: 'Missing admin credentials' });
    }

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: 'admin',
        email: adminEmail,
        role: 'admin',
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({ ok: true, data: { token, user: { email: adminEmail, role: 'admin' } } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
};
