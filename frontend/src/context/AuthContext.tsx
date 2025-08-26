/*'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';

type Rol = 'ADMIN' | 'TECNICO' | 'CERTIFICADOR' | 'LECTOR';
type User = { id: number; email: string; rol: Rol };

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Intenta levantar sesión desde cookie de refresh
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // pide un access con la cookie httpOnly 'rt'
        const r = await fetch(api('/auth/refresh'), { method: 'POST', credentials: 'include' });
        if (!r.ok) throw new Error('no refresh');
        const { accessToken } = await r.json();
        setAccessToken(accessToken);

        const me = await fetch(api('/auth/me'), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (me.ok) setUser(await me.json());
      } catch (_) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch(api('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // <— NECESARIO para recibir la cookie httpOnly
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const { error } = await r.json().catch(() => ({ error: 'Error de login' }));
      throw new Error(error || 'Error de login');
    }
    const data = await r.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await fetch(api('/auth/logout'), { method: 'POST', credentials: 'include' });
    setUser(null);
    setAccessToken(null);
  };

  // fetch con Authorization ya incluido
  const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
    if (!accessToken) throw new Error('No autenticado');
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(input, { ...init, headers });
  };

  const value = useMemo(
    () => ({ user, accessToken, loading, login, logout, authFetch }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
*/







// src/context/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, AUTH_BASE } from '@/services/api';

type Rol = 'ADMIN' | 'TECNICO' | 'CERTIFICADOR' | 'LECTOR';
type User = { id: number; email: string; rol: Rol };

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Levanta sesión desde cookie httpOnly (refresh)
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // ✅ backend: /api/auth/refresh
        const r = await fetch(api(`${AUTH_BASE}/refresh`), {
          method: 'POST',
          credentials: 'include',
        });
        if (!r.ok) throw new Error('no refresh');

        const { accessToken: token } = await r.json();
        setAccessToken(token);

        // ✅ /me está fuera de /api/auth
        const me = await fetch(api('/me'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (me.ok) setUser(await me.json());
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch(api(`${AUTH_BASE}/login`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // cookie httpOnly
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const { error } = await r.json().catch(() => ({ error: 'Error de login' }));
      throw new Error(error || 'Error de login');
    }
    const data = await r.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await fetch(api(`${AUTH_BASE}/logout`), { method: 'POST', credentials: 'include' });
    setUser(null);
    setAccessToken(null);
  };

  // fetch con Authorization + auto-refresh 1 vez si vence
  const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
    const doFetch = (token: string) => {
      const headers = new Headers(init.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(input, { ...init, headers, credentials: 'include' });
    };

    if (!accessToken) throw new Error('No autenticado');

    let res = await doFetch(accessToken);

    if ([401, 403, 419].includes(res.status)) {
      const rr = await fetch(api(`${AUTH_BASE}/refresh`), {
        method: 'POST',
        credentials: 'include',
      });
      if (rr.ok) {
        const { accessToken: newToken } = await rr.json();
        setAccessToken(newToken);
        res = await doFetch(newToken);
      }
    }

    return res;
  };

  const value = useMemo(
    () => ({ user, accessToken, loading, login, logout, authFetch }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
