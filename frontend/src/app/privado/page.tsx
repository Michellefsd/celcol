'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Privado() {
  const router = useRouter();

  useEffect(() => {
    // si querés volver a la home automáticamente:
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <p className="text-slate-700">Validando sesión…</p>
    </div>
  );
}
