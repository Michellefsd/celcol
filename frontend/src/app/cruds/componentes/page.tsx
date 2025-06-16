/*'use client';

import { useEffect, useState } from 'react';
import CrudManager, { CrudConfig, FieldOption } from '@/components/CrudManager';

type Componente = {
  id: number;
  nombre: string;
  tipo: string;
  numeroSerie?: string;
  tboHoras?: number;
  tboFecha?: string;
  propietario?: {
    id: number;
    nombre?: string;
    apellido?: string;
    nombreEmpresa?: string;
  };
  propietarioId?: number;
};

type Propietario = {
  id: number;
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
};

export default function ComponentesExternosPage() {
  const [propietariosOptions, setPropietariosOptions] = useState<FieldOption[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/propietarios')
      .then(res => res.json())
      .then((data: Propietario[]) => {
        const options = data.map((p): FieldOption => ({
          value: p.id.toString(),
          label: p.nombreEmpresa || `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim(),
        }));
        setPropietariosOptions(options);
      })
      .catch(err => {
        console.error('Error cargando propietarios:', err);
        setPropietariosOptions([]);
      });
  }, []);

  const config: CrudConfig<Componente> = {
    title: 'Componentes Externos',
    endpoint: 'http://localhost:3001/cruds/componentes',
    columns: ['nombre', 'tipo', 'numeroSerie', 'tboHoras', 'tboFecha', 'propietario'],
    formFields: [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'tipo', label: 'Tipo', type: 'text' },
      { name: 'numeroSerie', label: 'N° de Serie', type: 'text' },
      { name: 'tboHoras', label: 'TBO (Horas)', type: 'number' },
      { name: 'tboFecha', label: 'TBO (Fecha)', type: 'date' },
      { name: 'propietarioId', label: 'Propietario', type: 'select', options: propietariosOptions },
    ]
  };

  return <CrudManager {...config} />;
}
*/