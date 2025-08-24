// src/services/api.ts

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

// Devuelve URL absoluta al backend
export function api(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const base = API_URL.replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
}

export function apiUrl(path: string) {
  return api(path);
}

// ---- REFRESH TOLERANTE AL PATH ----
const REFRESH_PATHS = [
  '/auth/refresh',
  '/api/auth/refresh',
  process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH || '', // opcional por env
].filter(Boolean);

async function refreshAuth(): Promise<boolean> {
  try {
    for (const p of REFRESH_PATHS) {
      const res = await fetch(api(p), {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) return true;
    }
  } catch {}
  return false;
}

// ---- FETCH PRINCIPAL: con cookies + auto-refresh + MENSAJE REAL ----
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = api(path);

  const doFetch = () => {
    const isForm =
      typeof FormData !== 'undefined' && init.body instanceof FormData;

    const needsJson =
      !isForm &&
      (init.body != null ||
        (init.method && init.method.toUpperCase() !== 'GET'));

    const headers: HeadersInit = {
      Accept: 'application/json',
      ...(needsJson ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    };

    return fetch(url, {
      credentials: 'include',
      headers,
      ...init,
    });
  };

  let res = await doFetch();

  const shouldTryRefresh = (s: number) => s === 401 || s === 403 || s === 419;
  const isRefreshCall =
    REFRESH_PATHS.some((p) => path.includes(p)) ||
    path.includes('/auth/refresh') ||
    path.includes('/api/auth/refresh');

  if (!isRefreshCall && shouldTryRefresh(res.status)) {
    const ok = await refreshAuth();
    if (ok) res = await doFetch();
  }

  const ct = res.headers.get('content-type') || '';
  let body: any = null;
  try {
    if (ct.includes('application/json')) body = await res.json();
    else body = await res.text();
  } catch {
    body = null;
  }

  if (!res.ok) {
    // 👇 Preferimos mensaje del servidor si existe
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

// Alias semántico cuando esperás JSON
export async function fetchJson<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(path, init);
}

// Útil para descargas de texto/CSV/etc
export async function fetchText(
  path: string,
  init: RequestInit = {}
): Promise<string> {
  const text = await apiFetch<string>(path, {
    ...init,
    headers: {
      Accept: 'text/plain, text/csv, application/json;q=0.1',
      ...(init.headers || {}),
    },
  });
  return typeof text === 'string' ? text : String(text ?? '');
}

// Ejemplo de helper: obtener avión por matrícula
export async function getAvionPorMatricula(matricula: string) {
  return fetchJson(`/aviones/por-matricula/${encodeURIComponent(matricula)}`); // o el que uses
}
