'use client';

import { useEffect, useState } from 'react';
import { api, fetchJson } from '@/services/api';

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
      const data = await fetchJson<Aviso[]>('/avisos');
      setAvisos(data ?? []);
    } catch {
      setAvisos([]);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, []);

  const marcarComoLeido = async (id: number) => {
    try {
      await fetchJson(`/avisos/${id}/leido`, { method: 'PUT' });
      fetchAvisos();
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  };

  const eliminarAviso = async (id: number) => {
    const confirmar = confirm('¿Estás segura de que querés eliminar este aviso?');
    if (!confirmar) return;

    try {
      await fetchJson(`/avisos/${id}`, { method: 'DELETE' });
      fetchAvisos();
    } catch (error) {
      console.error('Error al eliminar aviso:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header con animación */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📢</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 animate-fade-in">
                  Avisos del Sistema
                </h1>
                <p className="text-slate-600 animate-fade-in-delay">
                  Mantente informado sobre las últimas notificaciones
                </p>
              </div>
            </div>
          </div>
        </div>

        {avisos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay avisos</h3>
            <p className="text-slate-500">No tienes notificaciones pendientes en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {avisos.map((a, index) => (
              <div
                key={a.id}
                className={`rounded-2xl border shadow-lg transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
                           ${a.leido 
                             ? 'bg-white border-slate-200' 
                             : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-red-100'
                           }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {!a.leido && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <h3 className={`font-semibold ${a.leido ? 'text-slate-700' : 'text-red-800'}`}>
                          {a.mensaje}
                        </h3>
                      </div>

                      {a.creadoEn && (
                        <p className="text-sm text-slate-500 mb-2">
                          📅 {new Date(a.creadoEn).toLocaleDateString('es-UY', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}

                      {!a.leido && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          No leído
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {!a.leido && (
                        <button
                          onClick={() => marcarComoLeido(a.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 text-sm font-medium shadow-sm"
                        >
                          <span>✓</span>
                          Marcar como leído
                        </button>
                      )}
                      <button
                        onClick={() => eliminarAviso(a.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transform hover:scale-105 transition-all duration-200 text-sm font-medium"
                      >
                        <span>🗑️</span>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fade-in-delay {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }
          
          .animate-fade-in-delay {
            animation: fade-in-delay 0.8s ease-out 0.2s both;
          }
        `}</style>
      </div>
    </div>
  );
}
