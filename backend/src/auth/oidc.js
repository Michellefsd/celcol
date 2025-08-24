// src/auth/oidc.js
import { createRemoteJWKSet, jwtVerify } from 'jose';

const {
  KC_BASE,
  KC_REALM,
  KC_CLIENT_ID,
  KC_CLIENT_SECRET,
  JWT_AUDIENCE, // ej: "account" o tu client-id
} = process.env;

const tokenEndpoint = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
const jwksUri = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/certs`;
const ISSUER = `${KC_BASE}/realms/${KC_REALM}`;

const JWKS = createRemoteJWKSet(new URL(jwksUri));

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
  if (!r.ok) throw new Error(`Token exchange failed: ${r.status} ${await r.text()}`);
  return r.json(); // { access_token, id_token, refresh_token, ... }
}

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
  if (!r.ok) throw new Error(`Refresh failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: JWT_AUDIENCE || KC_CLIENT_ID, // si usás "account" dejá JWT_AUDIENCE
  });
  return payload;
}
