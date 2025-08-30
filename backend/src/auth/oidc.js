// src/auth/oidc.js
import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify, decodeJwt } from 'jose';

const KC_BASE_CLEAN = (process.env.KC_BASE || '').replace(/\/$/, '');
const KC_REALM = process.env.KC_REALM;
const KC_CLIENT_ID = process.env.KC_CLIENT_ID;
const KC_CLIENT_SECRET = process.env.KC_CLIENT_SECRET;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE; // opcional
const DISABLE_JWT_VERIFY = process.env.DISABLE_JWT_VERIFY === '1';

// Issuer y endpoints (⚠️ KC_BASE debe ser HTTPS público)
const ISSUER = `${KC_BASE_CLEAN}/realms/${KC_REALM}`;
const tokenEndpoint = `${ISSUER}/protocol/openid-connect/token`;
const jwksUri = `${ISSUER}/protocol/openid-connect/certs`;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

// --- Intercambio de código por tokens ---
export async function exchangeCodeForToken(code, redirectUri) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: KC_CLIENT_ID,
    client_secret: KC_CLIENT_SECRET,
  });
  const r = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Token exchange failed: ${r.status} ${t}`);
  }
  return r.json();
}

// --- Refresh con refresh_token ---
export async function refreshWithToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KC_CLIENT_ID,
    client_secret: KC_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
  const r = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Refresh failed: ${r.status} ${t}`);
  }
  return r.json();
}

// --- Verificación de access_token ---
export async function verifyAccessToken(token) {
  if (DISABLE_JWT_VERIFY) {
    // Modo diagnóstico: no verifica firma, solo decodifica para seguir operando
    return decodeJwt(token);
  }

  const baseOpts = { issuer: ISSUER, algorithms: ['RS256'] };
  const aud = (JWT_AUDIENCE || KC_CLIENT_ID || '').trim();

  try {
    if (aud) {
      const { payload } = await jwtVerify(token, JWKS, { ...baseOpts, audience: aud });
      return payload;
    }
    const { payload } = await jwtVerify(token, JWKS, baseOpts);
    return payload;
  } catch (e) {
    const msg = String(e?.message || '');
    // Si falló por audience, reintenta sin audience
    if (/audience/i.test(msg) || e?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      const { payload } = await jwtVerify(token, JWKS, baseOpts);
      return payload;
    }
    throw e;
  }
}
