'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface Aviso {
  id: number;
  mensaje: string;
  leido: boolean;
  creadoEn?: string;
}

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const fetchAvisos = async () => {
    try {
      const res = await fetch(api('/avisos'));
      const data = await res.json();
      setAvisos(data);
    } catch {
      setAvisos([]);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, []);

  const marcarComoLeido = async (id: number) => {
    try {
      await fetch(api(`/avisos/${id}/leido`), { method: 'PUT' });
      fetchAvisos();
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  };

  const eliminarAviso = async (id: number) => {
    const confirmar = confirm('¿Estás segura de que querés eliminar este aviso?');
    if (!confirmar) return;

    try {
      await fetch(api(`/avisos/${id}`), { method: 'DELETE' });
      fetchAvisos();
    } catch (error) {
      console.error('Error al eliminar aviso:', error);
    }
  };

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
              className={`border p-3 rounded flex justify-between items-center ${
                a.leido ? 'bg-gray-100' : 'bg-red-100 border-red-400'
              }`}
            >
             <div>
  <p>{a.mensaje}</p>

  {a.creadoEn && (
    <p className="text-sm text-gray-500">
      {new Date(a.creadoEn).toLocaleDateString('es-UY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}
    </p>
  )}

  {!a.leido && (
    <span className="text-sm text-red-700 font-medium">No leído</span>
  )}
</div>

              <div className="flex space-x-2">
                {!a.leido && (
                  <button
                    onClick={() => marcarComoLeido(a.id)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Marcar como leído
                  </button>
                )}
                <button
                  onClick={() => eliminarAviso(a.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
