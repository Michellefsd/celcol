'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, AUTH_BASE } from '@/services/api';

type Rol = 'ADMIN' | 'TECNICO' | 'CERTIFICADOR' | 'LECTOR';
type User = { sub: string; email?: string; name?: string; roles?: Rol[] };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => void;           // redirección a KC
  logout: () => void;          // logout con redirección
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Boot: intenta refrescar sesión por cookie httpOnly y luego pide /me
  useEffect(() => {
    (async () => {
      try {
        // /auth/refresh → 204 si ok (setea cookies)
        const r = await fetch(api(`${AUTH_BASE}/refresh`), {
          method: 'POST',
          credentials: 'include',
        });

        if (r.ok) {
          // /me protegido por cookie cc_access (SIN Authorization header)
          const me = await fetch(api('/me'), { credentials: 'include' });
          if (me.ok) {
            const data = await me.json();
            setUser(data);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Inicia flujo OIDC (GET → redirección a KC)
  const login = () => {
    window.location.href = api(`${AUTH_BASE}/login`);
  };

  // Logout del backend + end_session de KC
  const logout = () => {
    window.location.href = api(`${AUTH_BASE}/logout`);
  };

  // fetch autenticado por COOKIE; si 401 intenta refresh UNA vez
  const authFetch = async (path: string, init: RequestInit = {}) => {
    const doFetch = () =>
      fetch(api(path), { ...init, credentials: 'include' });

    let res = await doFetch();
    if ([401, 403, 419].includes(res.status)) {
      const rr = await fetch(api(`${AUTH_BASE}/refresh`), {
        method: 'POST',
        credentials: 'include',
      });
      if (rr.ok) res = await doFetch();
    }
    return res;
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, authFetch }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
