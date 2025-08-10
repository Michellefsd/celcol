'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_ROUTES = ['/login']; // podés sumar otras públicas si hiciera falta

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.includes(pathname || '');
    if (!user && !isPublic) router.replace('/login');
  }, [user, loading, pathname, router]);

  if (loading) {
    return <div className="p-6 text-gray-600">Verificando sesión…</div>;
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname || '');
  if (!user && !isPublic) return null; // evita parpadeo

  return <>{children}</>;
}
