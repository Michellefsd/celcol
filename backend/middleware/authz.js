// middleware/authz.js
import cookie from 'cookie';
import { verifyAccessToken } from '../src/auth/oidc.js';

export function requireAuth(req, res, next) {
  (async () => {
    try {
      const cookies = cookie.parse(req.headers.cookie || '');
      let token = cookies.cc_access;

      if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (!token) return res.status(401).json({ error: 'missing token' });

      const payload = await verifyAccessToken(token);
      req.user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.realm_access?.roles || [], // keycloak roles de realm
      };
      next();
    } catch (e) {
      console.error('Auth error:', e?.message || e);
      res.status(401).json({ error: 'invalid token' });
    }
  })();
}

// uso: app.get('/ruta', requireAuth, requireRole('admin'), handler)
export function requireRole(role) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.includes(role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
