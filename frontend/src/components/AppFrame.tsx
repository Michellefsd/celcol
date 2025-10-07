'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AvisosIcon from '@/components/AvisosIcon';
import { User, KeyRound, LogOut } from 'lucide-react';


type Props = { children: React.ReactNode };

export default function AppFrame({ children }: Props) {
  const { logout } = useAuth();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // cerrar dropdown al click afuera + tecla Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Keycloak: pedir email de cambio de contraseña con fallback a panel
  const goChangePassword = async () => {
    try {
      const res = await fetch('/api/auth/password-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
      });
      if (!res.ok) throw new Error(`status_${res.status}`);
      alert('Te enviamos un email con el enlace para cambiar tu contraseña.');
    } catch (e) {
      console.error('password-email failed:', e);
      // Fallback: abrir panel mínimo de "Signing in"
      const kcBase = (process.env.NEXT_PUBLIC_KC_BASE || '').replace(/\/$/, '');
      const realm = process.env.NEXT_PUBLIC_KC_REALM || 'Celcol';
      if (kcBase) {
        const fallback = `${kcBase}/realms/${realm}/account/#/security/signing-in`;
        const ir = confirm(
          'No se pudo enviar el email de cambio de contraseña.\n\n¿Querés abrir el panel de seguridad para cambiarla ahí?'
        );
        if (ir) window.location.href = fallback;
      } else {
        alert('No se pudo enviar el email y no hay KC_BASE configurado para fallback.');
      }
    }
  };
  

  // Logout: backend redirige a KC (end_session) y vuelve a "/"
// Logout: backend redirige a KC (end_session) y vuelve a "/"
const handleLogout = () => {
  try {
    logout(); // ya redirige a /api/auth/logout desde el AuthProvider
  } catch (e) {
    console.error('Logout error', e);
    // Fallback por si algo raro pasa
    window.location.href = '/api/auth/logout';
  }
};


  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/privado">
            <Image src="/celcol-logo.webp" alt="Logo Celcol" width={140} height={112} />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Celcol</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* 🔔 Avisos siempre visible en la parte privada */}
          <AvisosIcon />

          {/* 👤 Menú usuario */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Usuario"
              title="Usuario"
              onClick={() => setOpen(v => !v)}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 w-9 h-9 flex items-center justify-center"
            >
              <User size={18} />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 z-50"
              >
                
                <div className="h-px bg-gray-200 my-1" />
<button
  role="menuitem"
  onClick={() => { setOpen(false); handleLogout(); }}
  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-rose-600"
>
  <LogOut size={16} />
  <span>Cerrar sesión</span>
</button>

              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full lg:w-[80%] max-w-[1800px] mx-auto px-6 py-8">
        {children}
      </main>
    </>
  );
  
}
