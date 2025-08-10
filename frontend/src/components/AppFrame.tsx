'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AvisosIcon from '@/components/AvisosIcon';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_ROUTES = ['/login'];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const { user, logout } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (isPublic) return <>{children}</>;

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

          {/* Menú de usuario */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Usuario"
                title="Usuario"
                onClick={() => setOpen(v => !v)}
                className="text-2xl leading-none select-none rounded-full hover:bg-gray-100 w-9 h-9 flex items-center justify-center"
              >
                👤
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-50">
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                    onClick={() => { setOpen(false); router.push('/usuario'); }}
                  >
                    Cambiar contraseña
                  </button>
                  <div className="h-px bg-gray-200 my-1" />
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-red-600"
                    onClick={async () => { setOpen(false); await logout(); router.replace('/login'); }}
                  >
                    Salir
                  </button>
                </div>
              )}
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
