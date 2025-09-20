/*use client';

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
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
};

export default function HerramientasPage() {
  const [refrescar, setRefrescar] = useState(false);
  const router = useRouter();

  const formFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'text' },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'numeroSerie', label: 'Número de serie', type: 'text' },
    { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
    { name: 'fechaVencimiento', label: 'Fecha de vencimiento', type: 'date' },
  ];

  return (
    <CrudManager<Herramienta>
      title="Herramientas calibrables"
      endpoint={api("/herramientas")}
      columns={[
        'nombre',
        'tipo',
        'marca',
        'modelo',
        'numeroSerie',
        'fechaIngreso',
        'fechaVencimiento',
      ]}
      formFields={formFields}
      onBeforeSubmit={() => null}
      onAfterCreate={() => setRefrescar(!refrescar)}
extraActions={(herramienta) => (
  <IconButton
    icon={IconVer}
    title="Ver detalle"
    className="text-cyan-600 hover:text-cyan-800"
    onClick={() => router.push(`/cruds/herramientas/${herramienta.id}`)}
  />
)}

    />
  );
}
*/





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
    if (!h.fechaVencimiento) return '';
    const hoy = new Date();
    const fv = new Date(h.fechaVencimiento);
    const diff = Math.ceil((fv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return '';
    if (diff < 0) return 'bg-rose-50';        // vencido
    if (diff <= 30) return 'bg-amber-50';     // por vencer
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        <CrudManager<Herramienta>
          title="Herramientas calibrables"
          endpoint={api('/herramientas')}
          columns={['nombre','tipo','marca','modelo','numeroSerie','numeroParte','fechaIngreso','fechaVencimiento']}
          formFields={formFields}
          onBeforeSubmit={() => null}
          onAfterCreate={() => setRefrescar(!refrescar)}
          rowClassName={rowClassName}
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
