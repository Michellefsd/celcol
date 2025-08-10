'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import SelectorDinamico from '@/components/SelectorDinamico';
import AsignacionesActuales from '@/components/AsignacionesActuales';

type Avion = {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  TSN?: number;
  vencimientoMatricula?: string;
  vencimientoSeguro?: string;
  certificadoMatricula?: string;
  ComponenteAvion?: {
    id: number;
    tipo?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    TSN?: number;
    TSO?: number;
    TBOHoras?: number;
    TBOFecha?: string;
  }[];
};

type Propietario = {
  tipoPropietario: 'PERSONA' | 'EMPRESA';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
  rut?: string;
};

type ComponenteExterno = {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  TSN?: number;
  TSO?: number;
  TBOHoras?: number;
  TBOFecha?: string;
  propietarioId?: number;
  propietario?: Propietario;
};


type OrdenTrabajo = {
  id: number;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA'; 
  avionId?: number;
  avion?: Avion;
  componenteId?: number;
  componente?: ComponenteExterno;
  solicitud?: string;
  solicitadoPor?: string;
  solicitudFirma?: string;
  OTsolicitud?: string;
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
  cantidad: number; // asegúrate de tener este campo en tu backend
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

type EmpleadoAsignadoExtendido = {
  empleadoId: number;
  rol: 'TECNICO' | 'CERTIFICADOR';
  empleado: {
    nombre: string;
    apellido: string;
  };
};

function renderCampo(label: string, valor: any) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <p>
      <strong>{label}:</strong> {valor}
    </p>
  );
}

  useEffect(() => {
    fetch(api(`/ordenes-trabajo/${id}`))
      .then(res => res.json())
      .then((data: OrdenExtendida) => {
        if (data.estadoOrden === 'CERRADA') {
          router.replace(`/ordenes-trabajo/${id}/cerrada`);
          return;
        }
        if (data.estadoOrden === 'CANCELADA') {
  router.replace(`/ordenes-trabajo/${id}/cancelada`);
  return;
}


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

// 👇 Agregamos consola para verificar estructura
      console.log('🧪 empleadosAsignados crudos:', data.empleadosAsignados);

      // 👇 Forzamos tipado, si coincide la estructura no habrá error
const empleados = data.empleadosAsignados as unknown as EmpleadoAsignadoExtendido[];

        setTecnicosSeleccionados(
  empleados
    .filter((e) => e.rol === 'TECNICO')
    .map((e) => ({
      id: e.empleadoId,
      nombre: `${e.empleado?.nombre ?? ''} ${e.empleado?.apellido ?? ''}`,
    }))
);

setCertificadoresSeleccionados(
  empleados
    .filter((e) => e.rol === 'CERTIFICADOR')
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

  // 🔐 Mapa de máximos disponibles por stock ID
  const stockMaximos = stock.reduce((acc, item) => {
    acc[item.id] = item.cantidad;
    return acc;
  }, {} as Record<number, number>);



/*
  return (
  <div className="p-6 max-w-3xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">Fase 3: Recepción y preparación</h1>

<div className="space-y-3 bg-gray-100 p-4 rounded text-sm">
  <p><strong>Tipo:</strong> {orden.avionId ? 'Avión' : 'Componente externo'}</p>

   <div className="bg-gray-100 p-4 rounded space-y-3">
      <div className="space-y-2 text-sm">
{orden.avion && (
  <>
    <p>
      <strong>Avión:</strong>{' '}
      <a
        href={`/cruds/aviones/${orden.avion.id}`}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {orden.avion.matricula} - {orden.avion.marca} {orden.avion.modelo}
      </a>
    </p>

    {orden.avion.numeroSerie && (
      <p><strong>Número de serie:</strong> {orden.avion.numeroSerie}</p>
    )}
    {orden.avion.TSN != null && (
      <p><strong>TSN:</strong> {orden.avion.TSN} hs</p>
    )}
    {orden.avion.vencimientoMatricula && (
      <p><strong>Vencimiento matrícula:</strong> {new Date(orden.avion.vencimientoMatricula).toLocaleDateString()}</p>
    )}
    {orden.avion.vencimientoSeguro && (
      <p><strong>Vencimiento seguro:</strong> {new Date(orden.avion.vencimientoSeguro).toLocaleDateString()}</p>
    )}
    {orden.avion.certificadoMatricula && (
      <div className="mt-2 flex gap-4 items-center text-sm">
        <a
          href={orden.avion.certificadoMatricula}
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver certificado de matrícula
        </a>
        <a
          href={orden.avion.certificadoMatricula}
          download
          className="text-blue-600 underline"
        >
          Descargar
        </a>
      </div>
    )}

{Array.isArray(orden.avion.ComponenteAvion) && orden.avion.ComponenteAvion.length > 0 && (
  <div className="mt-2">
    <p className="font-semibold">Componentes instalados:</p>
    <ul className="list-disc pl-5 text-sm">
      {orden.avion.ComponenteAvion.map((c) => (
        <li key={c.id}>
          {c.tipo ?? '—'} - {c.marca ?? '—'} {c.modelo ?? ''} (N° Serie: {c.numeroSerie ?? '—'})
          {c.TSN != null && ` — TSN: ${c.TSN} hs`}
          {c.TSO != null && ` — TSO: ${c.TSO} hs`}
          {c.TBOHoras != null && ` — TBO: ${c.TBOHoras} hs`}
          {c.TBOFecha && ` — Fecha TBO: ${new Date(c.TBOFecha).toLocaleDateString()}`}
        </li>
      ))}
    </ul>
  </div>
)}

  </>
)}

{orden.componente && (
  <>
    <p>
      <strong>Componente externo:</strong>{' '}
      <a
        href={`/propietarios/${orden.componente.propietarioId}`}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {orden.componente.tipo} - {orden.componente.marca} {orden.componente.modelo}
      </a>
    </p>

    {orden.componente.numeroSerie && (
      <p><strong>N° Serie:</strong> {orden.componente.numeroSerie}</p>
    )}
    {orden.componente.TSN != null && <p><strong>TSN:</strong> {orden.componente.TSN} hs</p>}
    {orden.componente.TSO != null && <p><strong>TSO:</strong> {orden.componente.TSO} hs</p>}
    {orden.componente.TBOHoras != null && <p><strong>TBO:</strong> {orden.componente.TBOHoras} hs</p>}
    {orden.componente.TBOFecha && (
      <p><strong>Fecha TBO:</strong> {new Date(orden.componente.TBOFecha).toLocaleDateString()}</p>
    )}

    {orden.componente.propietario && (
      <div className="mt-1">
        <p className="font-semibold">Propietario:</p>
        <p>
          {orden.componente.propietario.tipoPropietario === 'PERSONA'
            ? `${orden.componente.propietario.nombre} ${orden.componente.propietario.apellido}`
            : `${orden.componente.propietario.nombreEmpresa} (${orden.componente.propietario.rut})`}
        </p>
      </div>
    )}
  </>
)}

</div>
      </div>

{(orden.solicitud || orden.solicitadoPor || orden.OTsolicitud || orden.solicitudFirma) && (
  <div className="mt-4 space-y-2 text-sm bg-gray-100 p-4 rounded">
    <p className="font-semibold">Datos de la solicitud original</p>

    {orden.solicitud && (
      <p>
        <strong>Descripción del trabajo solicitado:</strong> {orden.solicitud}
      </p>
    )}

    {orden.solicitadoPor && (
      <p>
        <strong>Solicitado por:</strong> {orden.solicitadoPor}
      </p>
    )}

    {orden.OTsolicitud && (
      <p>
        <strong>N.º de OT previa:</strong> {orden.OTsolicitud}
      </p>
    )}

    {orden.solicitudFirma && (
      <div className="flex items-center gap-4">
        <a
          href={orden.solicitudFirma}
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver archivo de solicitud
        </a>
        <a
          href={orden.solicitudFirma}
          download
          className="text-blue-600 underline"
        >
          Descargar
        </a>
      </div>
    )}
  </div>
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
  opciones={herramientas.map((h) => ({
    id: h.id,
    nombre: [h.nombre, h.marca, h.modelo].filter(Boolean).join(' '),
  }))}
  permitirDuplicados={false}
  excluidos={herramientasSeleccionadas.map((h) => h.id)} // 👈 esta línea es clave
  onChange={(nuevos) => setHerramientasSeleccionadas(nuevos)}
/>


      <AsignacionesActuales
        titulo="Herramientas asignadas"
        items={herramientasSeleccionadas}
        editable
        onEliminar={(index) => {
          const nuevos = [...herramientasSeleccionadas];
          nuevos.splice(index, 1);
          setHerramientasSeleccionadas(nuevos);
        }}
      />

<SelectorDinamico
  label="Stock utilizado"
  opciones={stock
    .filter((s) => 
      s.cantidad > 0 && 
      !stockSeleccionado.some((sel) => sel.id === s.id)
    )
    .map((s) => ({
      id: s.id,
      nombre: [s.nombre, s.marca, s.modelo].filter(Boolean).join(' '),
    }))}
  conCantidad={true}
  maximos={stockMaximos}
  permitirDuplicados={false}
  onChange={(nuevos) => {
    const nuevosNormalizados = Array.isArray(nuevos) ? nuevos : [nuevos];
    setStockSeleccionado((prev) => [...prev, ...nuevosNormalizados]);
  }}
/>

      <AsignacionesActuales
        titulo="Stock asignado"
        items={stockSeleccionado}
        conCantidad
        editable
        onEliminar={(index) => {
          const nuevos = [...stockSeleccionado];
          const eliminado = nuevos.splice(index, 1)[0];
          setStockSeleccionado(nuevos);

          if (eliminado?.id && eliminado?.cantidad) {
            setStock((prev) =>
              prev.map((s) =>
                s.id === eliminado.id
                  ? { ...s, cantidad: s.cantidad + eliminado.cantidad! }
                  : s
              )
            );
          }
        }}
        onEditarCantidad={(index, nuevaCantidad) => {
          const nuevos = [...stockSeleccionado];
          nuevos[index].cantidad = nuevaCantidad;
          setStockSeleccionado(nuevos);
        }}
      />

<SelectorDinamico
  label="Técnicos asignados"
  opciones={personal
    .filter((p) => p.esTecnico)
    .map((p) => ({
      id: p.id,
      nombre: `${p.nombre} ${p.apellido}`,
    }))}
  permitirDuplicados={false}
  onChange={(nuevos) => {
    const nuevosNormalizados = Array.isArray(nuevos) ? nuevos : [nuevos];
    setTecnicosSeleccionados((prev) => {
      const combinados = [...prev, ...nuevosNormalizados];
      return combinados.filter(
        (item, index, self) => index === self.findIndex((i) => i.id === item.id)
      );
    });
  }}
/>

<AsignacionesActuales
  titulo="Técnicos asignados"
  items={tecnicosSeleccionados.map((t) => ({ ...t, meta: 'TECNICO' }))}
  editable
  onEliminar={(index) => {
    const nuevos = [...tecnicosSeleccionados];
    nuevos.splice(index, 1);
    setTecnicosSeleccionados(nuevos);
  }}
/>
<SelectorDinamico
  label="Certificadores asignados"
  opciones={personal
    .filter((p) => p.esCertificador)
    .map((p) => ({
      id: p.id,
      nombre: `${p.nombre} ${p.apellido}`,
    }))}
  permitirDuplicados={false}
  onChange={(nuevos) => {
    const nuevosNormalizados = Array.isArray(nuevos) ? nuevos : [nuevos];
    setCertificadoresSeleccionados((prev) => {
      const combinados = [...prev, ...nuevosNormalizados];
      return combinados.filter(
        (item, index, self) => index === self.findIndex((i) => i.id === item.id)
      );
    });
  }}
/>

<AsignacionesActuales
  titulo="Certificadores asignados"
  items={certificadoresSeleccionados.map((c) => ({ ...c, meta: 'CERTIFICADOR' }))}
  editable
  onEliminar={(index) => {
    const nuevos = [...certificadoresSeleccionados];
    nuevos.splice(index, 1);
    setCertificadoresSeleccionados(nuevos);
  }}
/>

  </div>
 */ 

{/*fases finales*/}
/*

    <div className="flex justify-between mt-6">
      <button onClick={() => router.push(`/ordenes-trabajo/${id}/fase2`)} className="text-blue-600 hover:underline">
        ← Fase anterior
      </button>
      <button onClick={() => router.push(`/ordenes-trabajo/${id}/fase4`)} className="text-blue-600 hover:underline">
        Fase siguiente →
      </button>
    </div>

    <div className="flex justify-end">
      <button onClick={handleGuardar} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">
        Guardar
      </button>
    </div>
  </div>
);
*/








return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Fase 3: Recepción y preparación</h1>

      {/* Resumen del objeto */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Tipo:</span>{' '}
            <span className="text-slate-800 font-medium">
              {orden.avionId ? 'Avión' : 'Componente externo'}
            </span>
          </p>

          {orden.avion && (
            <>
              <p>
                <span className="text-slate-500">Avión:</span>{' '}
                <a
                  href={`/cruds/aviones/${orden.avion.id}`}
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {orden.avion.matricula} — {orden.avion.marca} {orden.avion.modelo}
                </a>
              </p>

              {renderCampo('Número de serie', orden.avion.numeroSerie)}
              {orden.avion.TSN != null && (
                <p><span className="text-slate-500">TSN:</span> {orden.avion.TSN} hs</p>
              )}
              {orden.avion.vencimientoMatricula && (
                <p><span className="text-slate-500">Vencimiento matrícula:</span> {new Date(orden.avion.vencimientoMatricula).toLocaleDateString()}</p>
              )}
              {orden.avion.vencimientoSeguro && (
                <p><span className="text-slate-500">Vencimiento seguro:</span> {new Date(orden.avion.vencimientoSeguro).toLocaleDateString()}</p>
              )}

              {orden.avion.certificadoMatricula && (
                <div className="mt-2 flex gap-3 items-center text-sm">
                  <a
                    href={api(`/${orden.avion.certificadoMatricula}`)}
                    className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    👁️ Ver certificado de matrícula
                  </a>
                  <a
                    href={api(`/${orden.avion.certificadoMatricula}`)}
                    download
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Descargar
                  </a>
                </div>
              )}

              {Array.isArray(orden.avion.ComponenteAvion) && orden.avion.ComponenteAvion.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold text-slate-800">Componentes instalados:</p>
                  <ul className="list-disc pl-5 text-sm text-slate-700">
                    {orden.avion.ComponenteAvion.map((c) => (
                      <li key={c.id}>
                        {c.tipo ?? '—'} — {c.marca ?? '—'} {c.modelo ?? ''} (N° Serie: {c.numeroSerie ?? '—'})
                        {c.TSN != null && ` — TSN: ${c.TSN} hs`}
                        {c.TSO != null && ` — TSO: ${c.TSO} hs`}
                        {c.TBOHoras != null && ` — TBO: ${c.TBOHoras} hs`}
                        {c.TBOFecha && ` — Fecha TBO: ${new Date(c.TBOFecha).toLocaleDateString()}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {orden.componente && (
            <>
              <p>
                <span className="text-slate-500">Componente externo:</span>{' '}
                <a
                  href={`/propietarios/${orden.componente.propietarioId}`}
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {orden.componente.tipo} — {orden.componente.marca} {orden.componente.modelo}
                </a>
              </p>

              {renderCampo('N° Serie', orden.componente.numeroSerie)}
              {orden.componente.TSN != null && (
                <p><span className="text-slate-500">TSN:</span> {orden.componente.TSN} hs</p>
              )}
              {orden.componente.TSO != null && (
                <p><span className="text-slate-500">TSO:</span> {orden.componente.TSO} hs</p>
              )}
              {orden.componente.TBOHoras != null && (
                <p><span className="text-slate-500">TBO:</span> {orden.componente.TBOHoras} hs</p>
              )}
              {orden.componente.TBOFecha && (
                <p><span className="text-slate-500">Fecha TBO:</span> {new Date(orden.componente.TBOFecha).toLocaleDateString()}</p>
              )}

              {orden.componente.propietario && (
                <div className="mt-1">
                  <p className="font-semibold text-slate-800">Propietario:</p>
                  <p className="text-slate-700">
                    {orden.componente.propietario.tipoPropietario === 'PERSONA'
                      ? `${orden.componente.propietario.nombre} ${orden.componente.propietario.apellido}`
                      : `${orden.componente.propietario.nombreEmpresa} (${orden.componente.propietario.rut})`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Datos de la solicitud original */}
      {(orden.solicitud || orden.solicitadoPor || orden.OTsolicitud || orden.solicitudFirma) && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-2 text-sm">
          <p className="font-semibold text-slate-800">Datos de la solicitud original</p>
          {orden.solicitud && (
            <p><span className="text-slate-500">Descripción del trabajo solicitado:</span> {orden.solicitud}</p>
          )}
          {orden.solicitadoPor && (
            <p><span className="text-slate-500">Solicitado por:</span> {orden.solicitadoPor}</p>
          )}
          {orden.OTsolicitud && (
            <p><span className="text-slate-500">N.º de OT previa:</span> {orden.OTsolicitud}</p>
          )}
          {orden.solicitudFirma && (
            <div className="flex items-center gap-3">
              <a
                href={api(`/${orden.solicitudFirma}`)}
                className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                👁️ Ver archivo de solicitud
              </a>
              <a
                href={api(`/${orden.solicitudFirma}`)}
                download
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Descargar
              </a>
            </div>
          )}
        </section>
      )}

      {/* Formulario de inspección y observaciones */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inspeccionRecibida}
            onChange={(e) => setInspeccionRecibida(e.target.checked)}
          />
          <span className="text-slate-700">Inspección de recibimiento realizada</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Inspección previa (daños, condiciones)
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            rows={3}
            value={danosPrevios}
            onChange={(e) => setDanosPrevios(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Acción tomada</label>
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            rows={2}
            value={accionTomada}
            onChange={(e) => setAccionTomada(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        {/* Asignaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <SelectorDinamico
              label="Herramientas utilizadas"
              opciones={herramientas.map((h) => ({
                id: h.id,
                nombre: [h.nombre, h.marca, h.modelo].filter(Boolean).join(' '),
              }))}
              permitirDuplicados={false}
              excluidos={herramientasSeleccionadas.map((h) => h.id)}
              onChange={(nuevos) => setHerramientasSeleccionadas(nuevos)}
            />

            <AsignacionesActuales
              titulo="Herramientas asignadas"
              items={herramientasSeleccionadas}
              editable
              onEliminar={(index) => {
                const nuevos = [...herramientasSeleccionadas];
                nuevos.splice(index, 1);
                setHerramientasSeleccionadas(nuevos);
              }}
            />
          </div>

          <div className="space-y-3">
            <SelectorDinamico
              label="Stock utilizado"
              opciones={stock
                .filter((s) => s.cantidad > 0 && !stockSeleccionado.some((sel) => sel.id === s.id))
                .map((s) => ({
                  id: s.id,
                  nombre: [s.nombre, s.marca, s.modelo].filter(Boolean).join(' '),
                }))}
              conCantidad
              maximos={stockMaximos}
              permitirDuplicados={false}
              onChange={(nuevos) => {
                const nuevosNormalizados = Array.isArray(nuevos) ? nuevos : [nuevos];
                setStockSeleccionado((prev) => [...prev, ...nuevosNormalizados]);
              }}
            />

            <AsignacionesActuales
              titulo="Stock asignado"
              items={stockSeleccionado}
              conCantidad
              editable
              onEliminar={(index) => {
                const nuevos = [...stockSeleccionado];
                const eliminado = nuevos.splice(index, 1)[0];
                setStockSeleccionado(nuevos);

                if (eliminado?.id && eliminado?.cantidad) {
                  setStock((prev) =>
                    prev.map((s) =>
                      s.id === eliminado.id ? { ...s, cantidad: s.cantidad + eliminado.cantidad! } : s
                    )
                  );
                }
              }}
              onEditarCantidad={(index, nuevaCantidad) => {
                const nuevos = [...stockSeleccionado];
                nuevos[index].cantidad = nuevaCantidad;
                setStockSeleccionado(nuevos);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <SelectorDinamico
              label="Técnicos asignados"
              opciones={personal
                .filter((p) => p.esTecnico)
                .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellido}` }))}
              permitirDuplicados={false}
              onChange={(nuevos) => {
                const n = Array.isArray(nuevos) ? nuevos : [nuevos];
                setTecnicosSeleccionados((prev) => {
                  const combinados = [...prev, ...n];
                  return combinados.filter(
                    (item, index, self) => index === self.findIndex((i) => i.id === item.id)
                  );
                });
              }}
            />

            <AsignacionesActuales
              titulo="Técnicos asignados"
              items={tecnicosSeleccionados.map((t) => ({ ...t, meta: 'TECNICO' }))}
              editable
              onEliminar={(index) => {
                const nuevos = [...tecnicosSeleccionados];
                nuevos.splice(index, 1);
                setTecnicosSeleccionados(nuevos);
              }}
            />
          </div>

          <div className="space-y-3">
            <SelectorDinamico
              label="Certificadores asignados"
              opciones={personal
                .filter((p) => p.esCertificador)
                .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellido}` }))}
              permitirDuplicados={false}
              onChange={(nuevos) => {
                const n = Array.isArray(nuevos) ? nuevos : [nuevos];
                setCertificadoresSeleccionados((prev) => {
                  const combinados = [...prev, ...n];
                  return combinados.filter(
                    (item, index, self) => index === self.findIndex((i) => i.id === item.id)
                  );
                });
              }}
            />

            <AsignacionesActuales
              titulo="Certificadores asignados"
              items={certificadoresSeleccionados.map((c) => ({ ...c, meta: 'CERTIFICADOR' }))}
              editable
              onEliminar={(index) => {
                const nuevos = [...certificadoresSeleccionados];
                nuevos.splice(index, 1);
                setCertificadoresSeleccionados(nuevos);
              }}
            />
          </div>
        </div>

        {/* Fases finales + acciones */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => router.push(`/ordenes-trabajo/${id}/fase2`)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                         px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                         transform hover:scale-[1.02] transition-all duration-200"
          >
            ← Fase anterior
          </button>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleGuardar}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
                         font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4]
                         hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
            >
              Guardar
            </button>
            <button
              onClick={() => router.push(`/ordenes-trabajo/${id}/fase4`)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                         px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                         transform hover:scale-[1.02] transition-all duration-200"
            >
              Fase siguiente →
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
);


}
