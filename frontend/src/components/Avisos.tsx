'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react'; // ✅ IMPORTANTE
import { api } from '@/services/api';

interface Aviso {
  id: number;
  mensaje: string;
  leido: boolean;
}

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    fetch(api('/avisos'))
      .then((res) => res.json())
      .then(setAvisos)
      .catch(() => setAvisos([]));
  }, []);

  const pendientes = avisos.filter((a) => !a.leido);

  return (
    <Link href="/avisos" className="relative">
      <Mail className="w-6 h-6 text-gray-700 hover:text-black" />
      {pendientes.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
          {pendientes.length}
        </span>
      )}
    </Link>
  );
}
