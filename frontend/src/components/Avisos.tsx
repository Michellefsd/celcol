'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react'; // ✅ IMPORTANTE
import { api, fetchJson } from '@/services/api';

interface Aviso {
  id: number;
  mensaje: string;
  leido: boolean;
}

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    fetchJson<Aviso[]>('/avisos')
      .then(setAvisos)
      .catch(() => setAvisos([]));
  }, []);

  const pendientes = avisos.filter((a) => !a.leido);

  return (
    <Link href="/avisos" className="relative group">
      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 
                     group-hover:from-blue-100 group-hover:to-indigo-100 
                     transition-all duration-200 transform group-hover:scale-105">
        <Mail className="w-6 h-6 text-blue-600 group-hover:text-blue-800 transition-colors duration-200" />
      </div>
      {pendientes.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 
                        text-white text-xs rounded-full px-2 py-1 font-semibold shadow-lg
                        animate-pulse border-2 border-white">
          {pendientes.length}
        </span>
      )}
    </Link>
  );
}
