'use client';

import CrudManager, { Field } from '@/components/CrudManager';

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

const formFields: Field[] = [
  { name: 'nombre', label: 'Nombre', type: 'text' },
  { name: 'tipo', label: 'Tipo', type: 'text' },
  { name: 'marca', label: 'Marca', type: 'text' },
  { name: 'modelo', label: 'Modelo', type: 'text' },
  { name: 'numeroSerie', label: 'N° Serie', type: 'text' },
  { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
  { name: 'fechaVencimiento', label: 'Fecha de vencimiento', type: 'date' },
  { name: 'certificadoCalibracion', label: 'Certificado de calibración', type: 'file' },
];

export default function HerramientasPage() {
  return (
    <CrudManager<Herramienta>
      title="Herramientas calibrables"
      endpoint="http://localhost:3001/herramientas"
      columns={[
        'id',
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
    />
  );
}
