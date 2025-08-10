'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AvisosIcon from '@/components/AvisosIcon';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_ROUTES = ['/login'];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const { user, logout } = useAuth();

  if (isPublic) {
    // En /login no mostramos el header, solo el contenido
    return <>{children}</>;
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image src="/celcol-logo.webp" alt="Logo Celcol" width={140} height={112} />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">
            Celcol | Gestión aeronáutica
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <AvisosIcon />
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={logout}
                className="rounded-xl px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="w-full lg:w-[80%] max-w-[1800px] mx-auto px-6 py-8">
        {children}
      </main>
    </>
  );
}
