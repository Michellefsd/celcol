'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AvisosIcon from '@/components/AvisosIcon';
import { useAuth } from '@/context/AuthContext';
import { User, KeyRound, LogOut } from 'lucide-react'; // ⬅️ iconos

const PUBLIC_ROUTES = ['/login', '/reset', '/reset/[token]'];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const { user, logout } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // cerrar el menú si clickean afuera
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // acción: cambiar contraseña (Keycloak Account Console)
  const goChangePassword = () => {
    const kcBase = process.env.NEXT_PUBLIC_KC_BASE; // ej: http://localhost:9090 (en prod, tu KC público)
    const realm = 'Celcol';
    if (!kcBase) {
      alert('Falta NEXT_PUBLIC_KC_BASE en el .env del frontend');
      return;
    }
    window.location.href = `${kcBase}/realms/${realm}/account/password`;
  };

  // acción: cerrar sesión (tu contexto + redirección)
  const handleLogout = async () => {
    try {
      await logout();           // usa tu AuthContext
      router.replace('/login'); // vuelve al login
    } catch (e) {
      console.error(e);
      alert('No se pudo cerrar sesión.');
    }
  };

  if (isPublic) return <>{children}</>;

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image src="/celcol-logo.webp" alt="Logo Celcol" width={140} height={112} />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Celcol | Gestión aeronáutica</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Campanita de avisos: la dejamos tal cual */}
          <AvisosIcon />

          {/* Menú de usuario */}
          {user && (
            <div className="relative" ref={menuRef}>
              {/* Botón de usuario con icono */}
              <button
                type="button"
                aria-label="Usuario"
                title="Usuario"
                onClick={() => setOpen(v => !v)}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 w-9 h-9 flex items-center justify-center"
              >
                <User size={18} />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 z-50">
                  <button
                    onClick={() => { setOpen(false); goChangePassword(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50"
                  >
                    <KeyRound size={16} />
                    <span>Cambiar contraseña</span>
                  </button>
                  <div className="h-px bg-gray-200 my-1" />
                  <button
                    onClick={async () => { setOpen(false); await handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-rose-600"
                  >
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
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
