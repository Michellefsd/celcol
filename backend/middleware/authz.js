const cookie = require('cookie');
const { verifyAccessToken } = require('../src/auth/oidc');

async function requireAuth(req, res, next) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.cc_access;
    if (!token) return res.status(401).json({ error: 'missing token' });
    req.user = await verifyAccessToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { requireAuth };

