'use client';

import { useEffect, useState } from 'react';
import { api, fetchJson } from '@/services/api';
import BaseCard from '@/components/BaseCard';
import BaseHeading from '@/components/BaseHeading';
import TrabajoCard from '@/components/Home/TrabajoCard';

export default function ArchivadosPage() {
  const [data, setData] = useState<any>(null);
  const [tipo, setTipo] = useState<string>('ordenes');

  useEffect(() => {
    fetchJson<any>('/archivados')
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
          <ul className="mt-4 text-sm">
            {data.empleados.map((e: any) => (
              <li key={e.id}>{e.nombre} {e.apellido}</li>
            ))}
          </ul>
        );
      case 'herramientas':
        return (
          <ul className="mt-4 text-sm">
            {data.herramientas.map((h: any) => (
              <li key={h.id}>{h.nombre} – {h.marca} {h.modelo}</li>
            ))}
          </ul>
        );
      case 'stock':
        return (
          <ul className="mt-4 text-sm">
            {data.stock.map((s: any) => (
              <li key={s.id}>{s.nombre} ({s.tipoProducto})</li>
            ))}
          </ul>
        );
      case 'propietarios':
        return (
          <ul className="mt-4 text-sm">
            {data.propietarios.map((p: any) => (
              <li key={p.id}>{p.nombre}</li>
            ))}
          </ul>
        );
      case 'componentes':
        return (
          <ul className="mt-4 text-sm">
            {data.componentes.map((c: any) => (
              <li key={c.id}>{c.tipo} – {c.marca} {c.modelo}</li>
            ))}
          </ul>
        );
      case 'aviones':
        return (
          <ul className="mt-4 text-sm">
            {data.aviones.map((a: any) => (
              <li key={a.id}>{a.matricula} – {a.marca} {a.modelo}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

return (
  <BaseCard>
    <div className="flex flex-col gap-3">
      <BaseHeading>Archivados</BaseHeading>

      {/* Toolbar: select en mobile, segmentos en desktop */}
      <div className="flex items-center justify-between gap-3">
        {/* Mobile: Select */}
        <label className="w-full md:hidden">
          <span className="sr-only">Tipo de archivado</span>
          <select
            value={tipo}
            onChange={handleTipoChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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

        {/* Desktop: Segmentos */}
        <div className="hidden md:flex flex-wrap gap-2">
          {[
            { v: 'ordenes', t: 'Órdenes' },
            { v: 'empleados', t: 'Empleados' },
            { v: 'herramientas', t: 'Herramientas' },
            { v: 'stock', t: 'Stock' },
            { v: 'propietarios', t: 'Propietarios' },
            { v: 'componentes', t: 'Componentes' },
            { v: 'aviones', t: 'Aviones' },
          ].map((o) => {
            const active = tipo === o.v;
            return (
              <button
                key={o.v}
                onClick={() => handleTipoChange({ target: { value: o.v } } as any)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition
                           ${active
                             ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                             : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}
              >
                {o.t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        {renderContenido()}
      </div>
    </div>
  </BaseCard>
);

}
