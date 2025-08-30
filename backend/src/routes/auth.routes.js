// src/routes/auth.routes.js
import { Router } from 'express';
import cookie from 'cookie';
import 'dotenv/config';

const router = Router();

const {
  APP_URL = 'http://localhost:3000', // front
  KC_BASE = 'http://localhost:9090',
  KC_REALM,
  KC_CLIENT_ID,
  KC_CLIENT_SECRET,
  NODE_ENV,
  COOKIE_DOMAIN,
  // para /password-email
  KC_ADMIN_CLIENT_ID,
  KC_ADMIN_CLIENT_SECRET,
} = process.env;

const isProd = NODE_ENV === 'production';
const COOKIE_NAME_ACCESS = 'cc_access';
const COOKIE_NAME_REFRESH = 'cc_refresh';
const COOKIE_NAME_ID = 'cc_id'; // id_token para end_session

function baseCookieOpts() {
  return {
    httpOnly: true,
    secure: true,          // en prod: true
    sameSite: 'none',      // cross-site requiere None
    path: '/',
    // ⚠️ No fuerces domain. Si lo ponés, debe ser EXACTAMENTE 'celcol-production.up.railway.app'
    // domain: undefined,
  };
}



// Normaliza a una sola barra final (p.ej. "http://localhost:3000/")
function ensureTrailingSlash(u) {
  return `${u || ''}`.replace(/\/?$/, '/');
}

// Helpers para /password-email
async function getAdminToken() {
  if (!KC_ADMIN_CLIENT_ID || !KC_ADMIN_CLIENT_SECRET) {
    throw new Error('admin_client_not_configured');
  }
  const tokenUrl = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: KC_ADMIN_CLIENT_ID,
    client_secret: KC_ADMIN_CLIENT_SECRET,
  });
  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    console.error('admin token error:', t);
    throw new Error('admin_token_failed');
  }
  const j = await r.json();
  return j.access_token;
}

async function getUserInfo(accessToken) {
  const url = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/userinfo`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error('userinfo_failed');
  return r.json(); // { sub, email, ... }
}

// arma redirect_uri del callback en backend
function getProto(req) {
  return (req.headers['x-forwarded-proto'] || req.protocol || 'https');
}

function getHost(req) {
  return process.env.BACKEND_PUBLIC_HOST || req.get('host');
}

function buildCallbackUrl(req) {
  const proto = getProto(req);
  const host  = getHost(req);
  const base  = `${proto}://${host}${req.baseUrl}`;
  return `${base}/callback`;
}


// ---------- LOGIN ----------
router.get('/login', (req, res) => {
  const redirectUri = buildCallbackUrl(req);

  const authUrl = new URL(`${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/auth`);
  authUrl.searchParams.set('client_id', KC_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');

  return res.redirect(authUrl.toString());
});

// ---------- CALLBACK ----------
router.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    const redirectUri = buildCallbackUrl(req);

    const tokenUrl = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: KC_CLIENT_ID,
      client_secret: KC_CLIENT_SECRET,
      redirect_uri: redirectUri,
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

    const opts = baseCookieOpts();

    res.setHeader('Set-Cookie', [
      cookie.serialize(COOKIE_NAME_ACCESS, tok.access_token, {
        ...opts,
        maxAge: (tok.expires_in || 3600),
      }),
      cookie.serialize(COOKIE_NAME_REFRESH, tok.refresh_token || '', {
        ...opts,
        maxAge: (tok.refresh_expires_in || 2592000),
      }),
      cookie.serialize(COOKIE_NAME_ID, tok.id_token || '', {
        ...opts,
        maxAge: (tok.expires_in || 3600),
      }),
    ]);

    return res.redirect(`${APP_URL}/privado`);
  } catch (e) {
    console.error(e);
    return res.status(400).send('Auth error');
  }
});

// ---------- REFRESH ----------

router.get('/refresh', (req, res, next) => {
  req.method = 'POST';
  next();
});

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

      const expired = { ...baseCookieOpts(), maxAge: 0 };

      res.setHeader('Set-Cookie', [
        cookie.serialize(COOKIE_NAME_ACCESS, '', expired),
        cookie.serialize(COOKIE_NAME_REFRESH, '', expired),
        cookie.serialize(COOKIE_NAME_ID, '', expired),
      ]);
      return res.status(401).json({ error: 'refresh_failed' });
    }

    const tok = await r.json();
    const opts = baseCookieOpts();

    res.setHeader('Set-Cookie', [
      cookie.serialize(COOKIE_NAME_ACCESS, tok.access_token, {
        ...opts,
        maxAge: (tok.expires_in || 3600),
      }),
      cookie.serialize(COOKIE_NAME_REFRESH, tok.refresh_token || refreshToken, {
        ...opts,
        maxAge: (tok.refresh_expires_in || 2592000),
      }),
      cookie.serialize(COOKIE_NAME_ID, tok.id_token || cookies[COOKIE_NAME_ID] || '', {
        ...opts,
        maxAge: (tok.expires_in || 3600),
      }),
    ]);

    return res.status(204).end();
  } catch (e) {
    console.error('Refresh error:', e);
    return res.status(500).json({ error: 'internal' });
  }
});

// ---------- ME ----------
router.get('/me', (req, res) => {
  try {
    const cookiesObj = cookie.parse(req.headers.cookie || '');
    const access = cookiesObj[COOKIE_NAME_ACCESS];
    if (access) return res.sendStatus(200);
    return res.sendStatus(401);
  } catch {
    return res.sendStatus(401);
  }
});

// ---------- PASSWORD EMAIL (envía link de "Actualizar contraseña") ----------
router.post('/password-email', async (req, res) => {
  try {
    const cookiesObj = cookie.parse(req.headers.cookie || '');
    const access = cookiesObj[COOKIE_NAME_ACCESS];
    if (!access) return res.status(401).json({ error: 'no_session' });

    const info = await getUserInfo(access); // { sub, email, ... }
    const userId = info.sub;

    const adminToken = await getAdminToken();

    // 🔑 redirect_uri debe existir exactamente en "Valid Redirect URIs" del cliente celcol-app
    const redirectUri = ensureTrailingSlash(APP_URL); // ej: "http://localhost:3000/"

    const params = new URLSearchParams({
      client_id: KC_CLIENT_ID,
      redirect_uri: redirectUri,
      // lifespan: String(86400), // opcional (1 día)
    });
    const url = `${KC_BASE}/admin/realms/${KC_REALM}/users/${userId}/execute-actions-email?${params.toString()}`;

    const r = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(['UPDATE_PASSWORD']),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.error('execute-actions-email error:', t);
      return res.status(500).json({ error: 'send_email_failed', detail: t });
    }

    return res.status(204).end();
  } catch (e) {
    console.error('password-email error:', e);
    return res.status(500).json({ error: 'internal' });
  }
});

// ---------- LOGOUT (redirige a KC y vuelve a landing "/") ----------
router.get('/logout', (req, res) => {
  const cookiesObj = cookie.parse(req.headers.cookie || '');
  const idToken = cookiesObj[COOKIE_NAME_ID];

  const expired = { ...baseCookieOpts(), maxAge: 0 };

  // limpia cookies locales
  res.setHeader('Set-Cookie', [
    cookie.serialize(COOKIE_NAME_ACCESS, '', expired),
    cookie.serialize(COOKIE_NAME_REFRESH, '', expired),
    cookie.serialize(COOKIE_NAME_ID, '', expired),
  ]);

  // end_session → vuelve a la landing pública
  const postLogout = ensureTrailingSlash(APP_URL); // "http://localhost:3000/"
  const endSession = new URL(`${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/logout`);
  endSession.searchParams.set('post_logout_redirect_uri', postLogout);
  if (idToken) endSession.searchParams.set('id_token_hint', idToken);

  return res.redirect(endSession.toString());
});

export default router;
