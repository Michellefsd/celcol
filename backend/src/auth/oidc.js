const { createRemoteJWKSet, jwtVerify } = require('jose');
const fetch = global.fetch || require('node-fetch');

const KC_BASE = process.env.KC_BASE;
const KC_REALM = process.env.KC_REALM;
const KC_CLIENT_ID = process.env.KC_CLIENT_ID;
const KC_CLIENT_SECRET = process.env.KC_CLIENT_SECRET;

const tokenEndpoint = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
const jwksUri = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/certs`;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

async function exchangeCodeForToken(code, redirectUri) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: KC_CLIENT_ID,
    client_secret: KC_CLIENT_SECRET,
  });

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  }
  return res.json(); // { access_token, id_token, refresh_token, ... }
}

async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${KC_BASE}/realms/${KC_REALM}`,
  });
  return payload;
}

module.exports = { exchangeCodeForToken, verifyAccessToken };
