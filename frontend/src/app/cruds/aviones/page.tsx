'use client';

import CrudManager, { CrudConfig } from '@/components/CrudManager';
import AsignarPropietariosAvionModal from '@/components/Asignaciones/AsignarPropietariosAvion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; 


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

  const router = useRouter();

  useEffect(() => {
    fetch(api('/propietarios'))
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
      const res = await fetch(api(`/aviones/${avionId}`));
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
    endpoint: api('/aviones'),
    columns: [
      'marca',
      'modelo',
      'matricula',
      'numeroSerie',
      'TSN',
      'vencimientoMatricula',
      'vencimientoSeguro',
      'propietarios'
    ],
    formFields: [
      { name: 'marca', label: 'Marca', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text', required: true },
      { name: 'matricula', label: 'Matrícula', type: 'text', required: true },
      { name: 'numeroSerie', label: 'Número de Serie', type: 'text' },
      { name: 'TSN', label: 'TSN', type: 'number' },
      { name: 'vencimientoMatricula', label: 'Venc. Matrícula', type: 'date' },
      { name: 'vencimientoSeguro', label: 'Venc. Seguro', type: 'date' },
    ],
    onAfterCreate: (avion) => abrirModalConPropietarios(avion.id),
    extraActions: (avion) => (
  <div className="flex gap-3 items-center">
    <button
      onClick={() => abrirModalConPropietarios(avion.id)}
      className="text-sm text-blue-600 underline"
    >
      Editar propietarios
    </button>
    <button
      onClick={() => router.push(`/cruds/aviones/${avion.id}`)}
      title="Ver detalle"
      className="text-green-600 hover:text-green-800 text-sm"
    >
      👁
    </button>
  </div>
),

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
