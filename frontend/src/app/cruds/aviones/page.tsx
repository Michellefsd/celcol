'use client';

import CrudManager, { CrudConfig } from '@/components/CrudManager';
import AsignarPropietariosAvionModal from '@/components/Asignaciones/AsignarPropietariosAvion';
import { useEffect, useState } from 'react';

type Avion = {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  matricula: string;
  TSN?: number;
  vencimientoMatricula?: string;
  vencimientoSeguro?: string;
  certificadoMatricula?: string;
  propietarios?: {
    propietario: {
      id: number;
      nombreEmpresa?: string;
      nombre?: string;
      apellido?: string;
    };
  }[];
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

type AvionConPropietarios = {
  propietarios?: { propietario: { id: number } }[];
};

export default function AvionesPage() {
  const [propietarios, setPropietarios] = useState<PropietarioOption[]>([]);
  const [asignacionInfo, setAsignacionInfo] = useState<{
    avionId: number;
    seleccionados: string[];
  } | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/propietarios')
      .then(res => res.json())
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

  const abrirModalConPropietarios = async (avionId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/aviones/${avionId}`);
      const data: AvionConPropietarios = await res.json();
      const seleccionados =
        data.propietarios?.map((p) => p.propietario.id.toString()) ?? [];
      setAsignacionInfo({ avionId, seleccionados });
    } catch (err) {
      console.error('Error al obtener propietarios del avión', err);
    }
  };

  const config: CrudConfig<Avion> = {
    title: 'Aviones',
    endpoint: 'http://localhost:3001/aviones',
    columns: [
      'marca',
      'modelo',
      'matricula',
      'numeroSerie',
      'TSN',
      'vencimientoMatricula',
      'vencimientoSeguro',
      'certificadoMatricula',
      'propietarios'
    ],
    formFields: [
      { name: 'marca', label: 'Marca', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'matricula', label: 'Matrícula', type: 'text' },
      { name: 'numeroSerie', label: 'Número de Serie', type: 'text' },
      { name: 'TSN', label: 'TSN', type: 'number' },
      { name: 'vencimientoMatricula', label: 'Venc. Matrícula', type: 'date' },
      { name: 'vencimientoSeguro', label: 'Venc. Seguro', type: 'date' },
      { name: 'certificadoMatricula', label: 'Certificado de Matrícula', type: 'text' }
    ],
    onAfterCreate: (avion) => abrirModalConPropietarios(avion.id),
    extraActions: (avion) => (
      <button
        onClick={() => abrirModalConPropietarios(avion.id)}
        className="text-sm text-blue-600 underline"
      >
        Editar propietarios
      </button>
    )
  };

  return (
    <>
      <CrudManager {...config} />

      {asignacionInfo && (
        <AsignarPropietariosAvionModal
          avionId={asignacionInfo.avionId}
          propietariosSeleccionados={asignacionInfo.seleccionados}
          propietarios={propietarios}
          onClose={() => setAsignacionInfo(null)}
        />
      )}
    </>
  );
}
