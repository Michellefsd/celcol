// src/services/api.ts

// === Config ===
// Dejá NEXT_PUBLIC_API_URL vacío para usar el proxy same-origin (/api -> rewrites a Railway).
// NEXT_PUBLIC_AUTH_BASE debe ser /api/auth (coincide con tu next.config.ts).
export const API_URL  = process.env.NEXT_PUBLIC_API_URL || '';      // '' => proxy same-origin
export const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE || '/api/auth';

// Opcional: si usás una API key pública (no sensible)
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/* ---------------- Utils ---------------- */

function isAbsoluteUrl(v: string) {
  return /^https?:\/\//i.test(v);
}

function ensurePath(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();

  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof (obj as any).storageKey === 'string') return (obj as any).storageKey;
    if (typeof (obj as any).href === 'string')       return (obj as any).href;
    if (typeof (obj as any).url === 'string')        return (obj as any).url;
    if (typeof (obj as any).path === 'string')       return (obj as any).path;
    if (typeof (obj as any).key === 'string')        return (obj as any).key;
  }

  throw new TypeError('api(): path inválido');
}

// Construye la URL final para el navegador
export function api(p: unknown) {
  const path = ensurePath(p);
  if (isAbsoluteUrl(path)) return path;

  const rel = path.startsWith('/') ? path : `/${path}`;

  if (API_URL) {
    // Modo "API absoluta"
    const base = API_URL.replace(/\/+$/, '');
    return `${base}${rel}`;
    // Ej: https://celcol-production.up.railway.app/ordenes-trabajo
  }

  // Modo "proxy same-origin" -> asegura prefijo /api
  return rel.startsWith('/api/') ? rel : `/api${rel}`;
}

export function apiUrl(path: string) {
  return api(path);
}

/* --------------- Refresh híbrido (cookie + bearer) --------------- */

// Paths tolerantes de refresh
const REFRESH_PATHS = [
  `${AUTH_BASE}/refresh`,
  '/api/auth/refresh',
  '/auth/refresh',
];

// Token efímero en memoria (si el backend devuelve JSON con { accessToken })
let volatileAccessToken: string | undefined;

/** Intenta refrescar sesión. Devuelve si fue ok y, si aplica, el accessToken recibido. */
async function refreshAuth(): Promise<{ ok: boolean; accessToken?: string }> {
  for (const p of REFRESH_PATHS) {
    try {
      const res = await fetch(api(p), {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) continue;

      // Si el backend devuelve JSON con accessToken, úsalo (Safari-friendly)
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json().catch(() => null as any);
        if (j?.accessToken) {
          volatileAccessToken = j.accessToken;
          return { ok: true, accessToken: j.accessToken };
        }
      }
      // 204 o 200 sin JSON: ok igualmente (cookies actualizadas)
      return { ok: true };
    } catch {
      // intenta con el siguiente path
    }
  }
  return { ok: false };
}

/* ------------------- Fetch principal ------------------- */

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = api(path);

  const doFetch = (token?: string) => {
    // Unificamos headers
    const headers = new Headers(init.headers || {});
    const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;

    // Defaults razonables
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!isForm && init.body != null && !headers.has('Content-Type')) {
      const method = (init.method || 'GET').toUpperCase();
      if (method !== 'GET') headers.set('Content-Type', 'application/json');
    }
    if (PUBLIC_API_KEY && !headers.has('x-api-key')) {
      headers.set('x-api-key', PUBLIC_API_KEY);
    }

    // Authorization (si tenemos un token efímero o se pasó explícito)
    const bearer = token || volatileAccessToken;
    if (bearer && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${bearer}`);
    }

    return fetch(url, {
      ...init,
      headers,
      credentials: 'include', // clave: envía cookies en same-origin proxy
    });
  };

  let res = await doFetch();

  const shouldTryRefresh = (s: number) => s === 401 || s === 403 || s === 419;
  const isRefreshCall =
    REFRESH_PATHS.some((p) => url.includes(p)) ||
    REFRESH_PATHS.some((p) => path.includes(p));

  // Auto-refresh UNA vez si la llamada no es el propio refresh
  if (!isRefreshCall && shouldTryRefresh(res.status)) {
    const rr = await refreshAuth();
    if (rr.ok) res = await doFetch(rr.accessToken);
  }

  // Parseo tolerante
  const ct = res.headers.get('content-type') || '';
  let body: any = null;
  try {
    if (ct.includes('application/json')) body = await res.json();
    else body = await res.text();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const serverMsg =
      (body && (body.error || body.message)) ||
      (typeof body === 'string' && body) ||
      null;

    const err: any = new Error(serverMsg ? String(serverMsg) : `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body as T;
}

/* -------------------- Helpers convenientes -------------------- */

// Cuando esperás JSON
export async function fetchJson<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(path, init);
}

// Para descargas de texto/CSV/etc.
export async function fetchText(
  path: string,
  init: RequestInit = {}
): Promise<string> {
  const data = await apiFetch<string | unknown>(path, {
    ...init,
    headers: {
      Accept: 'text/plain, text/csv, application/json;q=0.1',
      ...(init.headers || {}),
    },
  });
  return typeof data === 'string' ? data : JSON.stringify(data ?? '');
}

// Ejemplo de helper de negocio
export async function getAvionPorMatricula(matricula: string) {
  return fetchJson(`/aviones/por-matricula/${encodeURIComponent(matricula)}`);
}
export function openInNewTab(url: string) {
  const win = window.open('about:blank', '_blank');
  if (win) win.location.replace(url);
}
