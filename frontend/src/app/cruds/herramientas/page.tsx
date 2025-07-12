'use client';

import { useState } from 'react';
import CrudManager from '@/components/CrudManager';

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

  const formFields = [
    { name: 'nombre', label: 'Nombre', type: 'text' },
    { name: 'tipo', label: 'Tipo', type: 'text' },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'numeroSerie', label: 'Número de serie', type: 'text' },
    { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
    { name: 'fechaVencimiento', label: 'Fecha de vencimiento', type: 'date' },
    { name: 'certificadoCalibracion', label: 'Certificado de calibración (PDF)', type: 'file' },
  ];

  return (
    <CrudManager<Herramienta>
      title="Herramientas calibrables"
      endpoint="http://localhost:3001/herramientas"
      columns={[
        'nombre',
        'tipo',
        'marca',
        'modelo',
        'numeroSerie',
        'fechaIngreso',
        'fechaVencimiento',
        'certificadoCalibracion',
      ]}
      formFields={formFields}
      onBeforeSubmit={() => null}
      onAfterCreate={() => setRefrescar(!refrescar)}
    />
  );
}
