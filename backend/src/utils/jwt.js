const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TTL = '15m';
const REFRESH_TTL_SEC = 14 * 24 * 60 * 60; // 14 días

function signAccess(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    roles: [user.rol],      // futuro: múltiples roles si querés
    aud: 'celcol',
    iss: 't2-identity',
  };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(user, jti) {
  const payload = { sub: String(user.id), jti, aud: 'celcol', iss: 't2-identity' };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL_SEC });
}

function signInvite(userId) {
  const payload = { sub: String(userId), purpose: 'invite' };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
}

function verifyAccess(token)  { return jwt.verify(token,  process.env.JWT_ACCESS_SECRET); }
function verifyRefresh(token) { return jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
function newJti()             { return crypto.randomUUID(); }

module.exports = { signAccess, signRefresh, signInvite, verifyAccess, verifyRefresh, newJti, REFRESH_TTL_SEC };
