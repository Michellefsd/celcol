'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface Aviso {
  id: number;
  mensaje: string;
  leido: boolean;
}

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    fetch(api('/avisos'))
      .then((res) => res.json())
      .then(setAvisos)
      .catch(() => setAvisos([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Avisos</h1>

      {avisos.length === 0 ? (
        <p className="text-gray-600">No hay avisos por mostrar.</p>
      ) : (
        <ul className="space-y-2">
          {avisos.map((a) => (
            <li
              key={a.id}
              className={`border p-3 rounded ${a.leido ? 'bg-gray-100' : 'bg-red-100 border-red-400'}`}
            >
              <p>{a.mensaje}</p>
              {!a.leido && <span className="text-sm text-red-700 font-medium">No leído</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
