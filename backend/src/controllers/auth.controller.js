const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cookie = require('cookie');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccess, signRefresh, signInvite, verifyRefresh, newJti, REFRESH_TTL_SEC } = require('../utils/jwt');
const argon2 = require('argon2');
const { newResetToken, verifySecret } = require('../utils/passwordReset');
const { sendPasswordReset } = require('../utils/mailer');


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







exports.forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  // Responder 200 siempre (no revelar si existe o no)
  try {
    if (email) {
      const user = await prisma.usuario.findUnique({ where: { email } });
      if (user) {
        await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });
        const { id, token, tokenHash } = await newResetToken();
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.passwordReset.create({
          data: {
            id, userId: user.id, tokenHash, expiresAt: expires,
            ip: req.ip, userAgent: req.get('user-agent') || null,
          },
        });
        const base = process.env.APP_BASE_URL || 'http://localhost:3000';
        const url = `${base}/reset/${token}`;
        await sendPasswordReset(email, url);
      }
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('forgotPassword error', e);
    return res.json({ ok: true });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const [id, secret] = token.split('.');
    if (!id || !secret) return res.status(400).json({ error: 'Token inválido' });

    const pr = await prisma.passwordReset.findUnique({ where: { id } });
    if (!pr) return res.status(400).json({ error: 'Token inválido' });
    if (pr.usedAt) return res.status(400).json({ error: 'Token ya utilizado' });
    if (pr.expiresAt < new Date()) return res.status(400).json({ error: 'Token expirado' });

    const ok = await verifySecret(pr.tokenHash, secret);
    if (!ok) return res.status(400).json({ error: 'Token inválido' });

    const newHash = await argon2.hash(password, { type: 2 });
    await prisma.usuario.update({
      where: { id: pr.userId },
      data: { hash: newHash, refreshJti: null },
    });
    await prisma.passwordReset.update({ where: { id }, data: { usedAt: new Date() } });

    return res.json({ ok: true });
  } catch (e) {
    console.error('resetPassword error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
