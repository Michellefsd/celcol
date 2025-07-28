'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import SelectorDinamico from '@/components/SelectorDinamico';

// Tipos locales

type Avion = {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
};

type ComponenteExterno = {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
};

type OrdenTrabajo = {
  id: number;
  avionId?: number;
  avion?: Avion;
  componenteId?: number;
  componente?: ComponenteExterno;
  solicitud?: string;
  solicitadoPor?: string;
  inspeccionRecibida?: boolean;
  danosPrevios?: string;
  accionTomada?: string;
  observaciones?: string;
};

type Herramienta = {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
};

type Stock = {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
};

type Personal = {
  id: number;
  nombre: string;
  apellido: string;
  esTecnico: boolean;
  esCertificador: boolean;
};

type SeleccionDinamica = {
  id: number;
  nombre: string;
  cantidad?: number;
};

type OrdenExtendida = OrdenTrabajo & {
  herramientas: { herramientaId: number; herramienta: Herramienta }[];
  stockAsignado: { stockId: number; cantidadUtilizada: number; stock: Stock }[];
  empleadosAsignados: { empleadoId: number; empleado: Personal }[];
};

export default function Fase3OrdenTrabajoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [inspeccionRecibida, setInspeccionRecibida] = useState(false);
  const [danosPrevios, setDanosPrevios] = useState('');
  const [accionTomada, setAccionTomada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);

  const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState<SeleccionDinamica[]>([]);
  const [stockSeleccionado, setStockSeleccionado] = useState<SeleccionDinamica[]>([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState<SeleccionDinamica[]>([]);
  const [certificadoresSeleccionados, setCertificadoresSeleccionados] = useState<SeleccionDinamica[]>([]);

  useEffect(() => {
    fetch(api(`/ordenes-trabajo/${id}`))
      .then(res => res.json())
      .then((data: OrdenExtendida) => {
        setOrden(data);
        setInspeccionRecibida(data.inspeccionRecibida ?? false);
        setDanosPrevios(data.danosPrevios ?? '');
        setAccionTomada(data.accionTomada ?? '');
        setObservaciones(data.observaciones ?? '');

        setHerramientasSeleccionadas(
          data.herramientas?.map((h) => ({
            id: h.herramientaId,
            nombre: h.herramienta?.nombre ?? '',
          })) ?? []
        );

        setStockSeleccionado(
          data.stockAsignado?.map((s) => ({
            id: s.stockId,
            nombre: s.stock?.nombre ?? '',
            cantidad: s.cantidadUtilizada,
          })) ?? []
        );

        const empleados = data.empleadosAsignados ?? [];
        setTecnicosSeleccionados(
          empleados
            .filter((e) => e.empleado?.esTecnico)
            .map((e) => ({
              id: e.empleadoId,
              nombre: `${e.empleado?.nombre ?? ''} ${e.empleado?.apellido ?? ''}`,
            }))
        );
        setCertificadoresSeleccionados(
          empleados
            .filter((e) => e.empleado?.esCertificador)
            .map((e) => ({
              id: e.empleadoId,
              nombre: `${e.empleado?.nombre ?? ''} ${e.empleado?.apellido ?? ''}`,
            }))
        );
      });

    fetch(api('/herramientas')).then(res => res.json()).then(setHerramientas);
    fetch(api('/stock')).then(res => res.json()).then(setStock);
    fetch(api('/personal')).then(res => res.json()).then(setPersonal);
  }, [id]);
const handleGuardar = async () => {
    const res = await fetch(api(`/ordenes-trabajo/${id}/fase3`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspeccionRecibida,
        danosPrevios,
        accionTomada,
        observaciones,
        herramientas: herramientasSeleccionadas.map((h) => h.id),
        stock: stockSeleccionado.map((s) => ({ stockId: s.id, cantidad: s.cantidad ?? 1 })),
        certificadores: certificadoresSeleccionados.map((c) => c.id),
        tecnicos: tecnicosSeleccionados.map((t) => t.id),
      }),
    });

    if (res.ok) {
      alert('Datos guardados correctamente');
      const updated = await res.json();
      setOrden(updated);
    } else {
      alert('Error al guardar');
    }
  };

  if (!orden) return <p className="p-4">Cargando orden...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Fase 3: Recepción y preparación</h1>

      <div className="space-y-3 bg-gray-100 p-4 rounded">
        <p><strong>Tipo:</strong> {orden.avionId ? 'Avión' : 'Componente externo'}</p>
        {orden.avion?.matricula && (
          <p><strong>Avión:</strong> {orden.avion.matricula} - {orden.avion.marca} {orden.avion.modelo}</p>
        )}
        {orden.componente?.tipo && (
          <p><strong>Componente:</strong> {orden.componente.tipo} - {orden.componente.marca} {orden.componente.modelo}</p>
        )}
        {orden.solicitud && (
          <p><strong>Solicitud original:</strong> {orden.solicitud}</p>
        )}
        {orden.solicitadoPor && (
          <p><strong>Solicitado por:</strong> {orden.solicitadoPor}</p>
        )}
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={inspeccionRecibida}
            onChange={(e) => setInspeccionRecibida(e.target.checked)}
          />
          Inspección de recibimiento realizada
        </label>

        <div>
          <label className="block font-medium mb-1">Inspección previa (daños, condiciones)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={danosPrevios}
            onChange={(e) => setDanosPrevios(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Acción tomada</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={2}
            value={accionTomada}
            onChange={(e) => setAccionTomada(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Observaciones</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <SelectorDinamico
          label="Herramientas utilizadas"
          opciones={herramientas.map((h) => {
  const marca = h.marca?.toString().trim();
  const modelo = h.modelo?.toString().trim();
  const descripcion =
    marca && marca !== 'undefined' && modelo && modelo !== 'undefined'
      ? `${marca} ${modelo}`
      : marca && marca !== 'undefined'
      ? marca
      : modelo && modelo !== 'undefined'
      ? modelo
      : '';

  return {
    id: h.id,
    nombre: descripcion ? `${h.nombre} (${descripcion})` : h.nombre,
  };
})}
          onChange={setHerramientasSeleccionadas}
        />

        <SelectorDinamico
          label="Stock utilizado"
         opciones={stock.map((s) => {
  const marca = s.marca?.toString().trim();
  const modelo = s.modelo?.toString().trim();
  const descripcion =
    marca && marca !== 'undefined' && modelo && modelo !== 'undefined'
      ? `${marca} ${modelo}`
      : marca && marca !== 'undefined'
      ? marca
      : modelo && modelo !== 'undefined'
      ? modelo
      : '';

  return {
    id: s.id,
    nombre: descripcion ? `${s.nombre} (${descripcion})` : s.nombre,
  };
})}

          conCantidad={true}
          onChange={setStockSeleccionado}
        />

        <SelectorDinamico
          label="Técnicos asignados"
          opciones={personal.filter(p => p.esTecnico).map((p) => ({
            id: p.id,
            nombre: `${p.nombre} ${p.apellido}`,
          }))}
          onChange={setTecnicosSeleccionados}
        />

        <SelectorDinamico
          label="Certificadores asignados"
          opciones={personal.filter(p => p.esCertificador).map((p) => ({
            id: p.id,
            nombre: `${p.nombre} ${p.apellido}`,
          }))}
          onChange={setCertificadoresSeleccionados}
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => router.push(`/ordenes-trabajo/${id}/fase2`)}
          className="text-blue-600 hover:underline"
        >
          ← Fase anterior
        </button>

        <button
          onClick={() => router.push(`/ordenes-trabajo/${id}/fase4`)}
          className="text-blue-600 hover:underline"
        >
          Fase siguiente →
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}