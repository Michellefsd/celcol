'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CrudManager from '@/components/CrudManager';
import { api } from '@/services/api'; 

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
        <button
          onClick={() => router.push(`/cruds/herramientas/${herramienta.id}`)}
          title="Ver detalle"
          className="text-green-600 hover:text-green-800 text-sm"
        >
          👁
        </button>
      )}
    />
  );
}
