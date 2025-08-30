// middleware/authz.js
import cookie from 'cookie';
import { verifyAccessToken } from '../src/auth/oidc.js';

const COOKIE_NAME_ACCESS = process.env.COOKIE_NAME_ACCESS || 'cc_access';
const KC_CLIENT_ID = process.env.KC_CLIENT_ID;

function extractRoles(payload) {
  const realm = payload?.realm_access?.roles || [];
  const client = KC_CLIENT_ID ? (payload?.resource_access?.[KC_CLIENT_ID]?.roles || []) : [];
  return Array.from(new Set([...realm, ...client]));
}

export async function requireAuth(req, res, next) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    let token = cookies[COOKIE_NAME_ACCESS];

    // Permitir Bearer como alternativa
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }
    if (!token) return res.status(401).json({ error: 'missing token' });

    const payload = await verifyAccessToken(token);

    req.user = {
      sub: payload.sub,
      email: payload.email || payload.preferred_username,
      name: payload.name || payload.given_name || payload.preferred_username,
      roles: extractRoles(payload),
    };

    return next();
  } catch (e) {
    const msg = e?.message || '';
    if (/expired/i.test(msg) || msg === 'jwt expired' || /exp/i.test(msg)) {
      return res.status(401).json({ error: 'token_expired' });
    }
    console.error('Auth error (requireAuth):', msg);
    return res.status(401).json({ error: 'invalid token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.includes(role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
