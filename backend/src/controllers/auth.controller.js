const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cookie = require('cookie');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccess, signRefresh, signInvite, verifyRefresh, newJti, REFRESH_TTL_SEC } = require('../utils/jwt');

function setRefreshCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize('rt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',                   // disponible para todo el sitio
    maxAge: REFRESH_TTL_SEC,
  }));
}

exports.invite = async (req, res) => {
  const { email, rol } = req.body;
  if (!email || !rol) return res.status(400).json({ error: 'email y rol son requeridos' });

  // crea si no existe; si existe y está INVITADO, reutilizamos
  let user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.usuario.create({
      data: { email, rol, estado: 'INVITADO', activo: true },
    });
  }

  if (user.estado === 'BLOQUEADO') return res.status(409).json({ error: 'Usuario bloqueado' });

  const token = signInvite(user.id);
  const acceptUrl = `/auth/accept?token=${token}`; // por ahora lo mostrás y lo copiás
  return res.json({ ok: true, acceptUrl, userId: user.id });
};

exports.accept = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token y password requeridos' });

  // verifico token de invitación con el secreto de access
  const jwt = require('jsonwebtoken');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return res.status(400).json({ error: 'Token inválido/expirado' });
  }
  if (payload.purpose !== 'invite') return res.status(400).json({ error: 'Token no es de invitación' });

  const user = await prisma.usuario.findUnique({ where: { id: parseInt(payload.sub) } });
  if (!user) return res.status(404).json({ error: 'Usuario no existe' });

  const hash = await hashPassword(password);
  await prisma.usuario.update({
    where: { id: user.id },
    data: { hash, estado: 'ACTIVO' },
  });

  return res.json({ ok: true });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user || !user.hash) return res.status(401).json({ error: 'Credenciales inválidas' });
  if (!user.activo || user.estado !== 'ACTIVO') return res.status(401).json({ error: 'Usuario inactivo' });

  const ok = await verifyPassword(user.hash, password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const jti = newJti();
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user, jti);

  await prisma.usuario.update({ where: { id: user.id }, data: { refreshJti: jti } });

  setRefreshCookie(res, refreshToken);
  return res.json({
    accessToken,
    user: { id: user.id, email: user.email, rol: user.rol },
  });
};

exports.refresh = async (req, res) => {
  const rt = req.cookies?.rt;
  if (!rt) return res.status(401).json({ error: 'Falta refresh' });

  let payload;
  try { payload = verifyRefresh(rt); } catch { return res.status(401).json({ error: 'Refresh inválido' }); }

  const userId = parseInt(payload.sub);
  const user = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!user || user.refreshJti !== payload.jti) return res.status(401).json({ error: 'Refresh revocado' });

  // ✅ SÍ:
const nextJti = newJti();
const newAccess = signAccess(user);
const newRefresh = signRefresh(user, nextJti);

await prisma.usuario.update({ where: { id: user.id }, data: { refreshJti: nextJti } });

  setRefreshCookie(res, newRefresh);
  return res.json({ accessToken: newAccess });
};

exports.logout = async (req, res) => {
  const rt = req.cookies?.rt;
  if (rt) {
    try {
      const { sub } = require('jsonwebtoken').decode(rt) || {};
      if (sub) await prisma.usuario.update({ where: { id: parseInt(sub) }, data: { refreshJti: null } });
    } catch {}
  }
  // borrar cookie
  res.setHeader('Set-Cookie', cookie.serialize('rt', '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
  }));
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  const id = parseInt(req.user.sub);
  const user = await prisma.usuario.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'No encontrado' });
  return res.json({ id: user.id, email: user.email, rol: user.rol });
};
