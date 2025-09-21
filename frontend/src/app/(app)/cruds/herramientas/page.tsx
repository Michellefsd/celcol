'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CrudManager from '@/components/CrudManager';
import { api } from '@/services/api';
import IconButton from '@/components/IconButton';
import { IconVer } from '@/components/ui/Icons';

type Herramienta = {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  numeroParte?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
};

// Helpers sutiles para vencimiento
const trunc = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
function diasRestantes(fecha?: string) {
  if (!fecha) return null;
  const hoy = trunc(new Date());
  const v = trunc(new Date(fecha));
  return Math.ceil((v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HerramientasPage() {
  const [refrescar, setRefrescar] = useState(false);
  const router = useRouter();

  const formFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'text' },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'numeroSerie', label: 'Número de serie', type: 'text' },
    { name: 'numeroParte', label: 'Número de parte', type: 'text' },
    { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
    { name: 'fechaVencimiento', label: 'Fecha de vencimiento', type: 'date' },
  ];

  const rowClassName = (h: Herramienta) => {
    const dr = diasRestantes(h.fechaVencimiento);
    if (dr === null) return '';
    if (dr <= 0) return 'bg-rose-50';   // vencida
    if (dr <= 30) return 'bg-amber-50'; // por vencer
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        <CrudManager<Herramienta>
          title="Herramientas calibrables"
          endpoint={api('/herramientas')}
          columns={[
            'nombre','tipo','marca','modelo','numeroSerie','numeroParte','fechaIngreso','fechaVencimiento'
          ]}
          formFields={formFields}
          onBeforeSubmit={() => null}
          onAfterCreate={() => setRefrescar(!refrescar)}
          rowClassName={rowClassName}
          renderCell={(key, item) => {
            if (key === 'nombre') {
              const dr = diasRestantes(item.fechaVencimiento);
              const dot =
                dr !== null && dr <= 0 ? (
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-rose-600 mr-2"
                    title="Herramienta vencida"
                  />
                ) : dr !== null && dr <= 30 ? (
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"
                    title={`Vence en ${dr} día(s)`}
                  />
                ) : null;

              return (
                <span className="inline-flex items-center">
                  {dot}
                  {item.nombre}
                </span>
              );
            }

            if (key === 'fechaVencimiento') {
              const dr = diasRestantes(item.fechaVencimiento);
              if (dr === null) return '—';
              if (dr <= 0) {
                return (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">
                    Herramienta vencida
                  </span>
                );
              }
              if (dr <= 30) {
                return (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    En {dr} día(s)
                  </span>
                );
              }
              // fuera de ventana: usar render por defecto (fecha formateada por CrudManager)
              return undefined;
            }

            return undefined; // otros campos → render por defecto
          }}
          extraActions={(herramienta) => (
            <div className="flex gap-2">
              <IconButton
                icon={IconVer}
                title="Ver detalle"
                className="text-cyan-600 hover:text-cyan-800"
                onClick={() => router.push(`/cruds/herramientas/${herramienta.id}`)}
              />
            </div>
          )}
        />
      </main>
    </div>
  );
}
