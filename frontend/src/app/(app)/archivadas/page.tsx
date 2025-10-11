'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/services/api';
import BaseCard from '@/components/BaseCard';
import BaseHeading from '@/components/BaseHeading';
import TrabajoCard from '@/components/Home/TrabajoCard';
import Link from 'next/link';
import { titleFor } from '@/lib/labels';



export default function ArchivadosPage() {
  const [data, setData] = useState<any>(null);
  const [tipo, setTipo] = useState<string>('ordenes');

  useEffect(() => {
    fetchJson<any>('/archivadas')
      .then(setData)
      .catch((err) => console.error('Error al cargar archivados:', err));
  }, []);

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipo(e.target.value);
  };

const renderContenido = () => {
  if (!data) return <p>Cargando...</p>;

  switch (tipo) {
    case 'ordenes':
      return <TrabajoCard soloArchivadas />;
      

    case 'empleados':
      return (
        <div className="space-y-3">
          {data.empleados?.length ? (
            data.empleados.map((e: any, index: number) => (
              <div
                key={e.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100
                           hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200
                           transform hover:scale-[1.02] hover:shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                <Link
                  href={`/archivadas/empleados/${e.id}`}
                  className="flex-1 text-slate-800 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  {e.nombre} {e.apellido}
                </Link>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-slate-500">No hay empleados archivados.</p>
            </div>
          )}
        </div>
      );

    case 'herramientas':
      return (
        <div className="space-y-3">
          {data.herramientas?.length ? (
            data.herramientas.map((h: any, index: number) => (
              <div
                key={h.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100
                           hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200
                           transform hover:scale-[1.02] hover:shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔧</span>
                </div>
                <Link
                  href={`/archivadas/herramientas/${h.id}`}
                  className="flex-1 text-slate-800 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  {h.nombre} – {h.marca} {h.modelo}
                </Link>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔧</span>
              </div>
              <p className="text-slate-500">No hay herramientas archivadas.</p>
            </div>
          )}
        </div>
      );

    case 'stock':
      return (
        <div className="space-y-3">
          {data.stock?.length ? (
            data.stock.map((s: any, index: number) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100
                           hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200
                           transform hover:scale-[1.02] hover:shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📦</span>
                </div>
                <Link
                  href={`/archivadas/stock/${s.id}`}
                  className="flex-1 text-slate-800 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  {s.nombre} ({s.tipoProducto})
                </Link>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-slate-500">No hay productos de stock archivados.</p>
            </div>
          )}
        </div>
      );

    case 'propietarios':
      return (
        <div className="space-y-3">
          {data.propietarios?.length ? (
            data.propietarios.map((p: any, index: number) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100
                           hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200
                           transform hover:scale-[1.02] hover:shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏢</span>
                </div>
                <Link
                  href={`/archivadas/propietarios/${p.id}`}
                  className="flex-1 text-slate-800 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  {p.nombre}
                </Link>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-slate-500">No hay propietarios archivados.</p>
            </div>
          )}
        </div>
      );

    case 'componentes':
      return (
        <div className="space-y-3">
          {data.componentes?.length ? (
            data.componentes.map((c: any, index: number) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100
                           hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200
                           transform hover:scale-[1.02] hover:shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚙️</span>
                </div>
                <Link
                  href={`/archivadas/componentes/${c.id}`}
                  className="flex-1 text-slate-800 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  {c.tipo} – {c.marca} {c.modelo}
                </Link>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="text-slate-500">No hay componentes externos archivados.</p>
            </div>
          )}
        </div>
      );

    case 'aviones':
      return (
        <div className="space-y-3">
          {data.aviones?.length ? (
            data.aviones.map((a: { id: number; matricula?: string; marca?: string; modelo?: string }, index: number) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100
                           hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200
                           transform hover:scale-[1.02] hover:shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">✈️</span>
                </div>
                <Link
                  href={`/archivadas/aviones/${a.id}`}
                  className="flex-1 text-slate-800 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  {a.matricula} – {a.marca} {a.modelo}
                </Link>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✈️</span>
              </div>
              <p className="text-slate-500">No hay {titleFor('avion').toLowerCase()} archivadas.</p>
            </div>
          )}
        </div>
      );

    default:
      return null;
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
            <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📁</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 animate-fade-in">
                Registros Archivados
              </h1>
              <p className="text-slate-600 animate-fade-in-delay">
                Gestiona y consulta los registros archivados del sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Toolbar mejorado */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          {/* Mobile: Select */}
          <label className="w-full md:hidden">
            <span className="sr-only">Tipo de archivado</span>
            <select
              value={tipo}
              onChange={handleTipoChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         transition-all duration-200 hover:border-slate-400"
            >
              <option value="ordenes">Órdenes de Trabajo</option>
              <option value="empleados">Empleados</option>
              <option value="herramientas">Herramientas</option>
              <option value="stock">Stock</option>
              <option value="propietarios">Propietarios</option>
              <option value="componentes">Componentes Externos</option>
              <option value="aviones">Aviones</option>
            </select>
          </label>

          {/* Desktop: Segmentos mejorados */}
          <div className="hidden md:flex flex-wrap gap-3">
            {[
              { v: 'ordenes', t: 'Órdenes', icon: '📋' },
              { v: 'empleados', t: 'Empleados', icon: '👥' },
              { v: 'herramientas', t: 'Herramientas', icon: '🔧' },
              { v: 'stock', t: 'Stock', icon: '📦' },
              { v: 'propietarios', t: 'Propietarios', icon: '🏢' },
              { v: 'componentes', t: 'Componentes', icon: '⚙️' },
              { v: 'aviones', t: 'Aviones', icon: '✈️' },
            ].map((o) => {
              const active = tipo === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => handleTipoChange({ target: { value: o.v } } as any)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200
                             ${active
                               ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-lg transform scale-105'
                               : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transform hover:scale-105'}`}
                >
                  <span>{o.icon}</span>
                  {o.t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {renderContenido()}
        </div>
      </div>

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
