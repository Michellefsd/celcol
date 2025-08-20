const express = require('express');
const cookie = require('cookie');
const crypto = require('crypto'); // <— PKCE
const router = express.Router();
require('dotenv').config();

const {
  APP_URL = 'http://localhost:3000',
  KC_BASE,
  KC_REALM,
  KC_CLIENT_ID,
  KC_CLIENT_SECRET,
  NODE_ENV,
  COOKIE_DOMAIN,
} = process.env;

const isProd = NODE_ENV === 'production';
const COOKIE_NAME_ACCESS = 'cc_access';
const COOKIE_NAME_REFRESH = 'cc_refresh';
const COOKIE_NAME_PKCE = 'pkce_verifier';

// --- helpers PKCE ---
function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function genCodeVerifier() {
  // 43–128 chars; 32 bytes -> 43 b64url chars
  return base64url(crypto.randomBytes(32));
}
function codeChallengeS256(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64url(hash);
}

// Arma redirect_uri del callback en backend
function buildCallbackUrl(req) {
  const base = `${req.protocol}://${req.get('host')}${req.baseUrl}`; // /api/auth
  return `${base}/callback`;
}

// ---------- LOGIN (con PKCE) ----------
router.get('/login', (req, res) => {
  const redirectUri = buildCallbackUrl(req);

  // PKCE: generamos/verificamos
  const codeVerifier = genCodeVerifier();
  const codeChallenge = codeChallengeS256(codeVerifier);

  // Guardamos el verifier en cookie httpOnly (corta vida)
  const pkceCookie = cookie.serialize(COOKIE_NAME_PKCE, codeVerifier, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN || undefined,
    maxAge: 5 * 60, // 5 minutos
  });
  res.setHeader('Set-Cookie', pkceCookie);

  const authUrl = new URL(`${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/auth`);
  authUrl.searchParams.set('client_id', KC_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  // PKCE
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return res.redirect(authUrl.toString());
});

// ---------- CALLBACK (con PKCE) ----------
router.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    const redirectUri = buildCallbackUrl(req);

    // Recuperar code_verifier de cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const codeVerifier = cookies[COOKIE_NAME_PKCE];
    if (!codeVerifier) {
      console.error('Missing PKCE code_verifier cookie');
      return res.status(400).send('Missing PKCE verifier');
    }

    const tokenUrl = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: KC_CLIENT_ID,
      client_secret: KC_CLIENT_SECRET, // sigue siendo confidential
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,     // <— PKCE
    });

    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('Token exchange failed:', txt);
      return res.status(500).send('Auth error (token exchange)');
    }

    const tok = await r.json();

    const baseCookie = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      domain: COOKIE_DOMAIN || undefined,
    };

    res.setHeader('Set-Cookie', [
      // limpiamos el pkce verifier
      cookie.serialize(COOKIE_NAME_PKCE, '', { ...baseCookie, maxAge: 0 }),
      cookie.serialize(COOKIE_NAME_ACCESS, tok.access_token, {
        ...baseCookie,
        maxAge: (tok.expires_in || 3600),
      }),
      cookie.serialize(COOKIE_NAME_REFRESH, tok.refresh_token || '', {
        ...baseCookie,
        maxAge: (tok.refresh_expires_in || 2592000),
      }),
    ]);

    return res.redirect(`${APP_URL}/`);
  } catch (e) {
    console.error(e);
    return res.status(400).send('Auth error');
  }
});




// ---------- REFRESH ----------
router.post('/refresh', async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const refreshToken = cookies[COOKIE_NAME_REFRESH];
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const tokenUrl = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: KC_CLIENT_ID,
      client_secret: KC_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('Refresh failed:', txt);
      // limpiamos cookies inválidas
      const baseCookie = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        domain: COOKIE_DOMAIN || undefined,
        maxAge: 0,
      };
      res.setHeader('Set-Cookie', [
        cookie.serialize(COOKIE_NAME_ACCESS, '', baseCookie),
        cookie.serialize(COOKIE_NAME_REFRESH, '', baseCookie),
      ]);
      return res.status(401).json({ error: 'refresh_failed' });
    }

    const tok = await r.json();
    const baseCookie = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax', // ajustaremos LUEGO según el Paso B
      path: '/',
      domain: COOKIE_DOMAIN || undefined,
    };

    res.setHeader('Set-Cookie', [
      cookie.serialize(COOKIE_NAME_ACCESS, tok.access_token, {
        ...baseCookie,
        maxAge: (tok.expires_in || 3600),
      }),
      cookie.serialize(COOKIE_NAME_REFRESH, tok.refresh_token || refreshToken, {
        ...baseCookie,
        maxAge: (tok.refresh_expires_in || 2592000),
      }),
    ]);

    return res.status(204).end();
  } catch (e) {
    console.error('Refresh error:', e);
    return res.status(500).json({ error: 'internal' });
  }
});




// ---------- LOGOUT ----------
router.post('/logout', (req, res) => {
  const baseCookie = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN || undefined,
    maxAge: 0,
  };
  res.setHeader('Set-Cookie', [
    cookie.serialize(COOKIE_NAME_ACCESS, '', baseCookie),
    cookie.serialize(COOKIE_NAME_REFRESH, '', baseCookie),
  ]);
  return res.status(204).end();
});

module.exports = router;
