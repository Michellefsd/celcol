'use client';

import CrudManager, { CrudConfig } from '@/components/CrudManager';
import AsignarPropietariosAvionModal from '@/components/Asignaciones/AsignarPropietariosAvion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson, api } from '@/services/api'; 
import IconButton from '@/components/IconButton';
import { IconVer } from '@/components/ui/Icons';
import { asArray } from '@/utils/isArray';       

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
    (async () => {
      try {
        // ← pide a /propietarios con cookies y parseo defensivo
        const data = await fetchJson<any>('/propietarios');
        const lista = asArray<PropietarioBackend>(data, 'items'); // soporta {..., items:[...]} o [...]
        const options: PropietarioOption[] = lista.map((p) => ({
          value: p.id.toString(),
          label: p.nombreEmpresa || `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim(),
        }));
        setPropietarios(options);
      } catch (err) {
        console.error('Error cargando propietarios:', err);
        setPropietarios([]); // fallback seguro
      }
    })();
  }, []);

  const abrirModalConPropietarios = async (avionId: number) => {
    try {
      // ← también con fetchJson para que viaje la cookie
      const data = await fetchJson<AvionConPropietarios>(`/aviones/${avionId}`);
      const seleccionados =
        asArray(data?.propietarios).map((p) => p.propietario.id.toString());
      setAsignacionInfo({ avionId, seleccionados });
    } catch (err) {
      console.error('Error al obtener propietarios del avión', err);
      setAsignacionInfo({ avionId, seleccionados: [] });
    }
  };

  const config: CrudConfig<Avion> = {
    title: 'Aviones',
    // 👇 CrudManager usa su propio fetch interno; le seguimos pasando URL absoluta:
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
      columnLabels: { 
    vencimientoMatricula: 'Venc. Cert. Aeronav.',
    vencimientoSeguro: 'Venc. Seguro',
  },
    formFields: [
      { name: 'marca', label: 'Marca', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text', required: true },
      { name: 'matricula', label: 'Matrícula', type: 'text', required: true },
      { name: 'numeroSerie', label: 'Número de Serie', type: 'text' },
      { name: 'TSN', label: 'TSN', type: 'number' },
      { name: 'vencimientoMatricula', label: 'Venc. Cert. Aeroavegabilidad', type: 'date' },
      { name: 'vencimientoSeguro', label: 'Venc. Seguro', type: 'date' },
    ],
    onAfterCreate: (avion) => abrirModalConPropietarios(avion.id),
    extraActions: (avion) => (
      <div className="flex gap-3 items-center">
        <IconButton
          icon={IconVer}
          title="Ver detalle"
          className="text-cyan-600 hover:text-cyan-800"
          onClick={() => router.push(`/cruds/aviones/${avion.id}`)}
        />
        <button
          onClick={() => abrirModalConPropietarios(avion.id)}
          className="text-sm text-blue-600 underline"
        >
          Editar propietarios
        </button>
      </div>
    ),
  };

  return (
    <div className="bg-gray-100 min-h-screen px-6 py-8">
      <CrudManager {...config} />

      {asignacionInfo && (
        <AsignarPropietariosAvionModal
          avionId={asignacionInfo.avionId}
          propietariosSeleccionados={asignacionInfo.seleccionados}
          propietarios={propietarios}
          onClose={() => setAsignacionInfo(null)}
        />
      )}
    </div>
  );
}

