'use client';


import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, fetchJson } from '@/services/api';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import IconButton from '@/components/IconButton';
import { IconVer } from '@/components/ui/Icons';
import { openPreviewCcm } from '@/lib/pdf';
import { openPreviewPdf } from '@/lib/pdf';


interface RegistroTrabajo {
  id?: number;
  empleadoId: number | '';
  fecha: string;
  horas: number | '';
  rol: 'TECNICO' | 'CERTIFICADOR' | '';
  trabajoRealizado?: string;
  guardado?: boolean;
}

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
}

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
  componentes?: {
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


interface Componente {
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  TSN?: number;
  TSO?: number;
  TBOHoras?: number;
  TBOFecha?: string;
  propietarioId?: number;
  propietario?: Propietario;
}

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

interface EmpleadoAsignado {
  empleadoId: number;
  empleado: Empleado;
  rol: 'TECNICO' | 'CERTIFICADOR';
}

interface HerramientaAsignada {
  herramientaId: number;
  herramienta: {
    nombre: string;
    marca?: string;
    modelo?: string;
  };
}

interface StockAsignado {
  stockId: number;
  cantidadUtilizada: number;
  stock: {
    nombre: string;
    marca?: string;
    modelo?: string;
  };
}

type ArchivoRef = {
  id: number;
  storageKey: string;
  mime?: string;
  originalName?: string;
  sizeAlmacen?: number;
};

interface OrdenTrabajo {
  id: number;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  archivoFactura?: ArchivoRef | null; 
  solicitudFirma?: ArchivoRef | null;  
  estadoFactura?: 'NO_ENVIADA' | 'ENVIADA' | 'PAGA' | '';
  numeroFactura?: string;
  registrosTrabajo?: RegistroTrabajo[];
  avion?: Avion;
  avionId?: number;
  componente?: Componente;
  solicitud?: string;
  solicitadoPor?: string;
  OTsolicitud?: string;
  inspeccionRecibida?: boolean;
  danosPrevios?: string;
  accionTomada?: string;
  observaciones?: string;
  empleadosAsignados?: EmpleadoAsignado[];
  herramientas?: HerramientaAsignada[];
  stockAsignado?: StockAsignado[];
}

export default function Fase4OrdenTrabajoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [estadoFactura, setEstadoFactura] = useState<OrdenTrabajo['estadoFactura']>('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [registros, setRegistros] = useState<RegistroTrabajo[]>([]);
  const [personal, setPersonal] = useState<Empleado[]>([]);
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);

function renderCampo(label: string, valor: any) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <p>
      <strong>{label}:</strong> {valor}
    </p>
  );
}


useEffect(() => {
  if (!id) return;

  const fetchData = async () => {
    try {
      const data = await fetchJson<OrdenTrabajo>(`/ordenes-trabajo/${id}`);

      // 🚫 Si no está en edición
      if (data.estadoOrden === 'CERRADA') {
        router.replace(`/ordenes-trabajo/${id}/cerrada`);
        return;
      }
      if (data.estadoOrden === 'CANCELADA') {
        router.replace(`/ordenes-trabajo/${id}/cancelada`);
        return;
      }

      // ✅ Cargar datos en estado
      setOrden(data);
      setEstadoFactura(data.estadoFactura ?? '');
      setNumeroFactura(data.numeroFactura ?? '');

      // ✅ Normalización de registros para el form
      setRegistros(
        (data.registrosTrabajo ?? []).map((r: any) => ({
          id: r.id,
          empleadoId: r.empleadoId ?? '',
          fecha: r.fecha ? String(r.fecha).slice(0, 10) : '',
          horas: typeof r.horas === 'number' ? r.horas : '',
          rol: (r.rol as 'TECNICO' | 'CERTIFICADOR' | '') ?? '',
          trabajoRealizado: r.trabajoRealizado ?? '',
          guardado: true,
        }))
      );
    } catch {
      setOrden(null);
    }
  };

  const fetchPersonal = async () => {
    try {
      const data = await fetchJson<Empleado[]>(`/personal`);
      setPersonal(data);
    } catch {
      setPersonal([]);
    }
  };

  fetchData();
  fetchPersonal();
}, [id, router]);

// Actualizar campos de un registro (por fila)
  const updateRegistro = (index: number, campo: keyof RegistroTrabajo, valor: any) => {
    setRegistros((prev) =>
      prev.map((reg, idx) =>
        idx === index
          ? { ...reg, [campo]: valor, guardado: false }
          : reg
      )
    );
  };

  // Guardar un registro
const guardarRegistro = async (index: number) => {
  const r = registros[index];
  if (!r.empleadoId || !r.fecha || (!r.horas && r.horas !== 0)) {
    alert('Faltan datos en la fila');
    return;
  }
  if (!r.rol) {
    alert('Seleccioná el rol del empleado');
    return;
  }

  try {
    const body = {
      empleadoId: Number(r.empleadoId),
      fecha: r.fecha,
      horas: Number(r.horas),
      rol: r.rol, // 'TECNICO' | 'CERTIFICADOR'
      trabajoRealizado: r.trabajoRealizado?.trim() || null,
    };

    const saved = await fetchJson<{ id: number }>(`/ordenes-trabajo/${id}/registro-trabajo`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    setRegistros((prev) =>
      prev.map((reg, idx) =>
        idx === index ? { ...reg, id: saved.id, guardado: true } : reg
      )
    );

    // refrescá la OT para que la lista y PDF queden al día
    fetchJson<OrdenTrabajo>(`/ordenes-trabajo/${id}`).then(setOrden);
  } catch (err: any) {
    alert(err.message || 'Error al guardar registro');
  }
};


  // Eliminar fila local (no en backend)
const eliminarFila = async (index: number) => {
  const r = registros[index];

  // Si el registro ya fue guardado (tiene ID), lo eliminamos en backend
  if (r.id) {
    const confirmar = confirm('¿Querés eliminar este registro de trabajo definitivamente?');
    if (!confirmar) return;

    try {
      await fetchJson(`/ordenes-trabajo/registro-trabajo/${r.id}`, { method: 'DELETE' });
    } catch {
      alert('Error al eliminar el registro del servidor');
      return;
    }
} 
  // En todos los casos, lo eliminamos del estado local
  setRegistros((prev) => prev.filter((_, i) => i !== index));
};
  // Agregar nueva fila vacía
const filaVacia: RegistroTrabajo = { empleadoId: '', fecha: '', horas: '', rol: '', trabajoRealizado: '', guardado: false };

const agregarFila = () => {
  setRegistros((prev) => [...prev, { ...filaVacia }]);
};



  // Guardar datos de factura (estado y número)
  const guardarFactura = async () => {
    try {
      await fetchJson(`/ordenes-trabajo/${id}/factura`, {
        method: 'PUT',
        body: JSON.stringify({ estadoFactura, numeroFactura }),
      });
      alert('Factura guardada');
    } catch (e: any) {
      alert(e?.body?.error || 'Error al guardar factura');
    }
  };
  if (!orden) return <p className="p-4">Cargando orden...</p>;

  // Agrupar stock por ID y sumar cantidades
const stockAgrupado = orden.stockAsignado?.reduce<Record<number, StockAsignado>>((acc, s) => {
  if (!acc[s.stockId]) {
    acc[s.stockId] = { ...s };
  } else {
    acc[s.stockId].cantidadUtilizada += s.cantidadUtilizada;
  }
  return acc;
}, {});

// Filtrar herramientas sin repeticiones
const herramientasUnicas = Array.from(
  new Map(
    (orden.herramientas ?? []).map((h) => [h.herramientaId, h])
  ).values()
);

// Agrupar empleados por rol y eliminar duplicados
const tecnicos = Array.from(
  new Map(
    orden.empleadosAsignados
      ?.filter((e) => e.rol === 'TECNICO')
      .map((e) => [e.empleadoId, e])
  ).values()
);

const certificadores = Array.from(
  new Map(
    orden.empleadosAsignados
      ?.filter((e) => e.rol === 'CERTIFICADOR')
      .map((e) => [e.empleadoId, e])
  ).values()
);


// roles permitidos por empleado en esta OT
const rolesPorEmpleado = new Map<number, Array<'TECNICO' | 'CERTIFICADOR'>>();
(orden?.empleadosAsignados ?? []).forEach((ea) => {
  const arr = rolesPorEmpleado.get(ea.empleadoId) ?? [];
  if (!arr.includes(ea.rol)) arr.push(ea.rol);
  rolesPorEmpleado.set(ea.empleadoId, arr);
});
const allowedRoles = (empleadoId: number | '') =>
  empleadoId ? rolesPorEmpleado.get(Number(empleadoId)) ?? [] : [];

// opciones de empleado SIN duplicados
const opcionesEmpleado = Array.from(
  new Map(
    (orden?.empleadosAsignados ?? []).map((ea) => [ea.empleadoId, ea.empleado])
  ).entries()
).map(([id, emp]) => ({ id, nombre: `${emp.nombre} ${emp.apellido}` }));



async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
  const q = new URLSearchParams({ key, disposition }).toString();
  return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
}

async function verFactura(key?: string) {
  if (!key) return;
  const win = window.open('about:blank', '_blank'); // abre YA para evitar bloqueos
  try {
    const { url } = await obtenerUrlFirmada(key, 'inline');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch (e) {
    win?.close();
    console.error('❌ No se pudo abrir la factura:', e);
  }
}

async function descargarFactura(key?: string) {
  if (!key) return;
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await obtenerUrlFirmada(key, 'attachment');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch (e) {
    win?.close();
    console.error('❌ No se pudo descargar la factura:', e);
  }
}

// VER solicitud (abre pestaña ya y luego la reemplaza)
async function verSolicitud(key?: string) {
  if (!key) return;
  const win = window.open('about:blank', '_blank'); // abre YA (gesto del usuario)
  try {
    const { url } = await obtenerUrlFirmada(key, 'inline');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60); // ayuda Safari/ blockers
  } catch (e) {
    win?.close();
    console.error('❌ No se pudo ver solicitud:', e);
  }
}

// DESCARGAR solicitud (igual que en herramientas)
async function descargarSolicitud(key?: string) {
  if (!key) return;
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await obtenerUrlFirmada(key, 'attachment');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch (e) {
    win?.close();
    console.error('❌ No se pudo descargar solicitud:', e);
  }
}





return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Fase 4: Cierre y factura</h1>

<section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
  <h2 className="text-lg font-semibold text-slate-900 mb-2">Objeto de la orden</h2>

  <div className="space-y-3 text-[15px] leading-7">
    <p>
      <span className="text-slate-500">Tipo:</span>{' '}
      <span className="text-slate-800 font-medium">
        {orden.avionId ? 'Avión' : 'Componente externo'}
      </span>
    </p>

    {orden.avion && (
      <>
        <p>
          <span className="text-slate-500">Aeronave:</span>{' '}
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
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[14px] leading-6">
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

        {(() => {
          const comps = (orden.avion.componentes ?? orden.avion.componentes) || [];
          return Array.isArray(comps) && comps.length > 0 ? (
            <div className="mt-3">
              <p className="font-semibold text-slate-800">Componentes instalados:</p>
              <ul className="list-disc pl-5 text-slate-700">
                {comps.map((c: any) => (
                  <li key={c.id}>
                    {c.tipo ?? '—'} — {c.marca ?? '—'} {c.modelo ?? ''}
                    {c.numeroSerie && ` (N° Serie: ${c.numeroSerie})`}
                    {c.TSN != null && ` — TSN: ${c.TSN} hs`}
                    {c.TSO != null && ` — TSO: ${c.TSO} hs`}
                    {c.TBOHoras != null && ` — TBO: ${c.TBOHoras} hs`}
                    {c.TBOFecha && ` — Fecha TBO: ${new Date(c.TBOFecha).toLocaleDateString()}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}
      </>
    )}

    {!orden.avion && orden.componente && (
      <>
        <p>
          <span className="text-slate-500">Componente externo:</span>{' '}
          <a
            href={`/cruds/propietarios/${orden.componente.propietarioId}`}
            className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {orden.componente.tipo} — {orden.componente.marca} {orden.componente.modelo}
          </a>
        </p>

        {renderCampo('N° Serie', orden.componente.numeroSerie)}
        {orden.componente.TSN != null && (<p><span className="text-slate-500">TSN:</span> {orden.componente.TSN}</p>)}
        {orden.componente.TSO != null && (<p><span className="text-slate-500">TSO:</span> {orden.componente.TSO}</p>)}
        {orden.componente.TBOHoras != null && (<p><span className="text-slate-500">TBO:</span> {orden.componente.TBOHoras}</p>)}
        {orden.componente.TBOFecha && (
          <p><span className="text-slate-500">Fecha TBO:</span> {new Date(orden.componente.TBOFecha).toLocaleDateString()}</p>
        )}

        {orden.componente.propietario && (
          <div className="mt-1">
            <p className="font-semibold text-slate-800">Propietario:</p>
            <p className="text-slate-700">
              {orden.componente.propietario.tipoPropietario === 'PERSONA'
                ? `${orden.componente.propietario.nombre} ${orden.componente.propietario.apellido}`
                : `${orden.componente.propietario.nombreEmpresa}${orden.componente.propietario.rut ? ` (${orden.componente.propietario.rut})` : ''}`}
            </p>
          </div>
        )}
      </>
    )}
  </div>
</section>


  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
  <h2 className="text-lg font-semibold text-slate-900 mb-2">Datos de la orden</h2>

  <div className="space-y-3 text-[15px] leading-7">
    {(orden.solicitud || orden.solicitadoPor || orden.OTsolicitud || orden.solicitudFirma) && (
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">Datos de la solicitud original</h3>
        {renderCampo('Descripción del trabajo solicitado', orden.solicitud)}
        {renderCampo('Solicitado por', orden.solicitadoPor)}
        {renderCampo('N.º de OT previa', orden.OTsolicitud)}

      {orden.solicitudFirma?.storageKey && (
  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[14px] leading-6">
    <button
      type="button"
      onClick={() => verSolicitud(orden.solicitudFirma!.storageKey)}
      className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      👁️ Ver archivo de solicitud
    </button>

    <button
      type="button"
      onClick={() => descargarSolicitud(orden.solicitudFirma!.storageKey)}
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
    >
      Descargar
    </button>
  </div>
)}

      </div>
    )}

    {renderCampo('Inspección al recibir', orden.inspeccionRecibida ? 'Sí' : 'No')}
    {renderCampo('Daños previos', orden.danosPrevios)}
    {renderCampo('Reporte', orden.accionTomada)}
    {renderCampo('Observaciones', orden.observaciones)}

    {!!herramientasUnicas.length && (
      <div>
        <strong>Herramientas:</strong>
        <ul className="list-disc ml-6">
          {herramientasUnicas.map((h: any, i: number) => (
            <li key={i}>
              {h.herramienta.nombre}
              {(h.herramienta.marca || h.herramienta.modelo) &&
                ` (${h.herramienta.marca ?? ''} ${h.herramienta.modelo ?? ''})`}
            </li>
          ))}
        </ul>
      </div>
    )}

    {!!stockAgrupado && (
      <div>
        <strong>Stock:</strong>
        <ul className="list-disc ml-6">
          {Object.values(stockAgrupado).map((s: any, i: number) => (
            <li key={i}>
              {s.stock.nombre}
              {(s.stock.marca || s.stock.modelo) &&
                ` (${s.stock.marca ?? ''} ${s.stock.modelo ?? ''})`}
              {' — '}
              {s.cantidadUtilizada} unidad(es)
            </li>
          ))}
        </ul>
      </div>
    )}

    {!!orden.empleadosAsignados?.length && (
      <div className="space-y-2">
        {!!certificadores.length && (
          <div>
            <strong>Certificadores:</strong>
            <ul className="list-disc ml-6">
              {certificadores.map((e: any, i: number) => (
                <li key={`cert-${i}`}>{e.empleado.nombre} {e.empleado.apellido}</li>
              ))}
            </ul>
          </div>
        )}
        {!!tecnicos.length && (
          <div>
            <strong>Técnicos:</strong>
            <ul className="list-disc ml-6">
              {tecnicos.map((e: any, i: number) => (
                <li key={`tec-${i}`}>{e.empleado.nombre} {e.empleado.apellido}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </div>
</section>

{/* REGISTRO DE TRABAJO — coherente con Fase 3 */}
<section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <h2 className="text-lg font-semibold text-slate-900">Registro de trabajo</h2>
    <button
      onClick={agregarFila}
      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
                 font-semibold px-4 py-2 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4]
                 hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
    >
      + Agregar fila
    </button>
  </div>

  <div className="mt-4 grid gap-3">
    {registros.map((r, i) => {
      const inval = {
        emp: !r.empleadoId,
        fec: !r.fecha,
        hrs: !r.horas && r.horas !== 0,
        rol: !r.rol,
      };
      const roles = allowedRoles(r.empleadoId);

      return (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-[1.2fr,0.9fr,0.9fr,0.7fr,1.6fr,auto,auto,auto] items-center gap-2"
        >
          {/* Empleado */}
          <select
            value={r.empleadoId}
            onChange={(e) => updateRegistro(i, 'empleadoId', Number(e.target.value) || '')}
            className={`w-full rounded-xl border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                       ${inval.emp ? 'border-rose-400' : 'border-slate-300'}`}
          >
            <option value="">— Seleccionar empleado —</option>
            {opcionesEmpleado.map((op) => (
              <option key={op.id} value={op.id}>{op.nombre}</option>
            ))}
          </select>

          {/* Fecha */}
          <input
            type="date"
            value={r.fecha}
            onChange={(e) => updateRegistro(i, 'fecha', e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                       ${inval.fec ? 'border-rose-400' : 'border-slate-300'}`}
          />

          {/* Rol */}
          <select
            value={r.rol}
            onChange={(e) => updateRegistro(i, 'rol', e.target.value)}
            disabled={!r.empleadoId}
            className={`w-full rounded-xl border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                       ${inval.rol ? 'border-rose-400' : 'border-slate-300'} ${!r.empleadoId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
          >
            <option value="">— Rol —</option>
            {roles.includes('TECNICO') && <option value="TECNICO">Técnico</option>}
            {roles.includes('CERTIFICADOR') && <option value="CERTIFICADOR">Certificador</option>}
          </select>

          {/* Horas */}
          <input
            type="number"
            step="0.5"
            min={0}
            value={r.horas}
            onChange={(e) => updateRegistro(i, 'horas', e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="0"
            className={`w-full rounded-xl border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                       ${inval.hrs ? 'border-rose-400' : 'border-slate-300'}`}
          />

          {/* Trabajo realizado (opcional, para el PDF) */}
          <input
            type="text"
            value={r.trabajoRealizado ?? ''}
            onChange={(e) => updateRegistro(i, 'trabajoRealizado', e.target.value)}
            placeholder="Descripción breve del trabajo"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />

          {/* Guardar */}
          <button
            onClick={() => guardarRegistro(i)}
            title="Guardar registro"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white px-3 py-2
                       hover:bg-emerald-700 transition shadow-sm"
          >
            💾
          </button>

          {/* Eliminar fila */}
          <button
            onClick={() => eliminarFila(i)}
            title="Eliminar fila"
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 text-white px-3 py-2
                       hover:bg-rose-700 transition shadow-sm"
          >
            🗑
          </button>

          {/* Estado */}
          <span className={`text-sm ${r.guardado ? 'text-emerald-600' : 'text-slate-400'}`}>
            {r.guardado ? '✔ Guardado' : '—'}
          </span>
        </div>
      );
    })}
  </div>

  {/* Totales / hint */}
  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <p className="text-sm text-slate-500">Tip: podés cargar medias horas con “0.5”.</p>
    <p className="text-sm font-medium text-slate-700">
      Total horas: {registros.reduce((acc, r) => acc + (typeof r.horas === 'number' ? r.horas : 0), 0)}
    </p>
  </div>
</section>


      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Factura</h2>

        <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Número de factura</label>
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={numeroFactura}
          onChange={(e) => setNumeroFactura(e.target.value)}
        />

        <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Estado de factura</label>
        <select
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={estadoFactura}
          onChange={(e) => setEstadoFactura(e.target.value as OrdenTrabajo['estadoFactura'])}
        >
          <option value="">— Seleccionar —</option>
          <option value="NO_ENVIADA">No enviada</option>
          <option value="ENVIADA">Enviada</option>
          <option value="PAGA">Paga</option>
        </select>

        <div className="mt-6">
          <button
            onClick={() => setMostrarSubirFactura(true)}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-4 py-2 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
          >
            Subir archivo de factura
          </button>

          <SubirArchivo
            open={mostrarSubirFactura}
            onClose={() => setMostrarSubirFactura(false)}
            url={`/ordenes-trabajo/${id}/factura`}
            label="Subir archivo de factura"
            nombreCampo="archivoFactura"
            onUploaded={() => {
              setMostrarSubirFactura(false);
              fetchJson<OrdenTrabajo>(`/ordenes-trabajo/${id}`).then(setOrden);
            }}
          />

       {orden.archivoFactura?.storageKey && (
  <div className="mt-2 flex gap-3 items-center text-sm">
    <button
      type="button"
      onClick={() => verFactura(orden.archivoFactura!.storageKey)}
      className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      👁️ Ver archivo
    </button>
    <button
      type="button"
      onClick={() => descargarFactura(orden.archivoFactura!.storageKey)}
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
    >
      Descargar
    </button>
  </div>
)}

        </div>
      </section>
<section className="flex flex-col sm:flex-row gap-3 justify-between items-center">
 <IconButton
      icon={IconVer}
      title="PDF prevew"
      label="Vista previa PDF"
      onClick={() => openPreviewPdf(orden.id)}
    />
    <IconButton
      icon={IconVer}
      title="CCM preview"
      label="Vista previa CCM"
      onClick={() => openPreviewCcm(orden.id)}
    />
</section>
     
      <section className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <button
          onClick={() => (window.location.href = `/ordenes-trabajo/${id}/fase3`)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                     px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                     transform hover:scale-[1.02] transition-all duration-200"
        >
          ← Fase anterior
        </button>

        <div className="flex gap-3">
          <button
            onClick={async () => {
              const confirmar = confirm('¿Estás segura que querés cancelar esta orden de trabajo?');
              if (!confirmar) return;
              try {
                await fetchJson(`/ordenes-trabajo/${id}/cancelar`, { method: 'PUT' });
                alert('Orden cancelada con éxito');
                window.location.href = `/ordenes-trabajo/${id}/cancelada`;
              } catch (e: any) {
                alert(e?.body?.error || 'Error al cancelar la orden');
              }
            }}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                       px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                       transform hover:scale-[1.02] transition-all duration-200"
          >
            Cancelar orden
          </button>

          <button
            onClick={async () => {
              const confirmar = confirm('¿Estás segura que querés cerrar esta orden de trabajo? Esta acción no se puede deshacer.');
              if (!confirmar) return;
              try {
                await fetchJson(`/ordenes-trabajo/${id}/cerrar`, { method: 'PUT' });
                alert('Orden cerrada con éxito');
                window.location.href = `/ordenes-trabajo/${id}/cerrada`;
              } catch (e: any) {
                alert(e?.body?.error || 'Error al cerrar la orden');
              }
            }}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                       font-semibold px-5 py-2.5 shadow-sm hover:from-emerald-600 hover:to-emerald-700
                       hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
          >
            Cerrar orden de trabajo
          </button>
        </div>
      </section>
    </main>
  </div>
);

  
}