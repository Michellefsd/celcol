const { verifyAccess } = require('../src/utils/jwt');

function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta token' });

  try {
    req.user = verifyAccess(token); // { sub, email, roles, ... }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function authorize(roles = []) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = roles.length === 0 || roles.some(r => userRoles.includes(r));
    if (!ok) return res.status(403).json({ error: 'Sin permiso' });
    next();
  };
}

module.exports = { authenticateJWT, authorize };
