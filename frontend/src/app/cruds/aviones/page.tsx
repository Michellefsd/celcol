'use client';

import CrudManager from '@/components/CrudManager';
import AsignarPropietariosModal from '@/components/Asignaciones/AsignarPropietarios';
import { useEffect, useState } from 'react';

type Avion = {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  matricula: string;
  horasDesdeNuevo?: number;
  vencimientoMatricula?: string;
  vencimientoSeguro?: string;
  certificadoMatricula?: string;
  propietarios?: { nombreEmpresa?: string; nombre?: string; apellido?: string }[];
};

type PropietarioBackend = {
  id: number;
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
};

type PropietarioOption = {
  value: string;
  label: string;
};

export default function AvionesPage() {
  const [propietarios, setPropietarios] = useState<PropietarioOption[]>([]);
  const [avionIdParaAsignar, setAvionIdParaAsignar] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/propietarios')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener propietarios');
        return res.json();
      })
      .then((data: PropietarioBackend[]) => {
        const options = data.map((p): PropietarioOption => ({
          value: p.id.toString(),
          label: p.nombreEmpresa || `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim()
        }));
        setPropietarios(options);
      })
      .catch(err => {
        console.error('Error cargando propietarios:', err);
        setPropietarios([]);
      });
  }, []);

  return (
    <>
      <CrudManager<Avion>
        title="Aviones"
        endpoint="http://localhost:3001/aviones"
        columns={[
          'marca',
          'modelo',
          'numeroSerie',
          'matricula',
          'horasDesdeNuevo',
          'vencimientoMatricula',
          'vencimientoSeguro',
          'certificadoMatricula',
          'propietarios'
        ]}
        formFields={[
          { name: 'marca', label: 'Marca', type: 'text' },
          { name: 'modelo', label: 'Modelo', type: 'text' },
          { name: 'numeroSerie', label: 'Número de Serie', type: 'text' },
          { name: 'matricula', label: 'Matrícula', type: 'text' },
          { name: 'horasDesdeNuevo', label: 'Horas desde nuevo', type: 'number' },
          { name: 'vencimientoMatricula', label: 'Venc. Matrícula', type: 'date' },
          { name: 'vencimientoSeguro', label: 'Venc. Seguro', type: 'date' },
          { name: 'certificadoMatricula', label: 'Certificado de Matrícula', type: 'text' }
        ]}
        onAfterCreate={(nuevoAvion) => setAvionIdParaAsignar(nuevoAvion.id)}
      />

      {avionIdParaAsignar && (
        <AsignarPropietariosModal
          avionId={avionIdParaAsignar}
          propietarios={propietarios}
          onClose={() => setAvionIdParaAsignar(null)}
        />
      )}
    </>
  );
}
