/*'use client';

import { useEffect, useState } from 'react';
import { api, fetchJson } from '@/services/api';
import { useParams, useSearchParams } from 'next/navigation';

export default function OrdenCanceladaPage() {

  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params?.id) ? params?.id?.[0] : params?.id;

interface Empleado {
  nombre: string;
  apellido: string;
}

interface EmpleadoAsignado {
  empleado: Empleado;
  rol: 'TECNICO' | 'CERTIFICADOR';
}

interface StockAsignado {
  stock: {
    nombre: string;
    marca?: string;
    modelo?: string;
  };
  cantidadUtilizada: number;
}

interface HerramientaAsignada {
  herramienta: {
    nombre: string;
    marca?: string;
    modelo?: string;
  };
}

interface RegistroTrabajo {
  empleado: {
    nombre: string;
    apellido: string;
  };
  horasTrabajadas: number;
  fecha: string;
}

interface Avion {
  id: number;
  matricula?: string;
  marca?: string;
  modelo?: string;
  TSN?: string;
  TSO?: string;
  TBO?: string;
  fechaTBO?: string;
}

interface Componente {
  id: number;
  tipo?: string;
  marca?: string;
  modelo?: string;
  TSN?: string;
  TSO?: string;
  TBO?: string;
  fechaTBO?: string;
}

interface OrdenTrabajo {
  id: number;
  solicitadoPor?: string;
  solicitud?: string;
  solicitudFirma?: string | ArchivoRef | null;  
  inspeccionRecibida?: boolean;
  danosPrevios?: string;
  accionTomada?: string;
  observaciones?: string;
  numeroFactura?: string;
  archivoFactura?: string | ArchivoRef | null;
  estadoFactura?: string;
  fechaApertura?: string;
  fechaCierre?: string;

  datosAvionSnapshot?: {
    matricula?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    TSN?: string;
    TSO?: string;
    TBO?: string;
    fechaTBO?: string;
    vencimientoMatricula?: string;
    vencimientoSeguro?: string;
    certificadoMatricula?: string;
  };

  datosComponenteSnapshot?: {
    tipo?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    numeroParte?: string;
    TSN?: string;
    TSO?: string;
    TBO?: string;
    fechaTBO?: string;
    archivo8130?: string;
  };

  datosPropietarioSnapshot?: {
    tipo?: 'PERSONA' | 'EMPRESA';
    nombre?: string;
    apellido?: string;
    cedula?: string;
    razonSocial?: string;
    nombreEmpresa?: string;
    rut?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  };

  empleadosAsignados?: EmpleadoAsignado[];
  stockAsignado?: StockAsignado[];
  herramientas?: HerramientaAsignada[];
  registrosTrabajo?: RegistroTrabajo[];
  avion?: Avion;
  componente?: Componente;
}

type ArchivoRef = { storageKey: string; mime?: string | null; originalName?: string | null };

// normaliza string | {storageKey} | null -> string | undefined
function asKey(v?: string | ArchivoRef | null): string | undefined {
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.storageKey;
}

async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment' = 'inline') {
  const q = new URLSearchParams({ key, disposition }).toString();
  // usa tu fetchJson + backend /archivos/url-firmada
  return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
}

// “Solo ver” (abre en nueva pestaña)
async function verArchivo(input?: string | ArchivoRef | null) {
  const key = asKey(input);
  if (!key) return;
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await obtenerUrlFirmada(key, 'inline');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch {
    win?.close();
  }
}


  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);

const search = useSearchParams();
const includeArchived =
  search.get('includeArchived') === '1' || search.get('includeArchived') === 'true';

useEffect(() => {
  if (!id) return;
  const qs = includeArchived ? '?includeArchived=1' : '';
  fetchJson<OrdenTrabajo>(`/ordenes-trabajo/${encodeURIComponent(id)}${qs}`)
    .then(setOrden)
    .catch(err => console.error('Error al cargar orden:', err));
}, [id, includeArchived]);


  if (!orden) return <p className="p-4">Cargando orden cancelada...</p>;

const esDeComponente = Boolean(orden.datosComponenteSnapshot);


    return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Orden de trabajo #{orden.id} (cancelada)
      </h1>

      {// CARD — Resumen (snapshots) }
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>

        {// Avión (snapshot) }
        {orden.datosAvionSnapshot && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del avión al momento de la cancelación
            </h3>
            {orden.fechaApertura && <p><span className="text-slate-500">Fecha de apertura:</span> {orden.fechaApertura}</p>}
            {orden.fechaCierre && <p><span className="text-slate-500">Fecha de cancelación:</span> {orden.fechaCierre}</p>}
            {orden.datosAvionSnapshot.matricula && <p><span className="text-slate-500">Matrícula:</span> {orden.datosAvionSnapshot.matricula}</p>}
            {orden.datosAvionSnapshot.marca && <p><span className="text-slate-500">Marca:</span> {orden.datosAvionSnapshot.marca}</p>}
            {orden.datosAvionSnapshot.modelo && <p><span className="text-slate-500">Modelo:</span> {orden.datosAvionSnapshot.modelo}</p>}
            {orden.datosAvionSnapshot.numeroSerie && <p><span className="text-slate-500">Número de serie:</span> {orden.datosAvionSnapshot.numeroSerie}</p>}
            {orden.datosAvionSnapshot.TSN && <p><span className="text-slate-500">TSN:</span> {orden.datosAvionSnapshot.TSN}</p>}
            {orden.datosAvionSnapshot.TSO && <p><span className="text-slate-500">TSO:</span> {orden.datosAvionSnapshot.TSO}</p>}
            {orden.datosAvionSnapshot.TBO && <p><span className="text-slate-500">TBO:</span> {orden.datosAvionSnapshot.TBO}</p>}
            {orden.datosAvionSnapshot.fechaTBO && <p><span className="text-slate-500">Fecha TBO:</span> {orden.datosAvionSnapshot.fechaTBO}</p>}
            {orden.datosAvionSnapshot.vencimientoMatricula && <p><span className="text-slate-500">Vencimiento matrícula:</span> {new Date(orden.datosAvionSnapshot.vencimientoMatricula).toLocaleDateString()}</p>}
            {orden.datosAvionSnapshot.vencimientoSeguro && <p><span className="text-slate-500">Vencimiento seguro:</span> {new Date(orden.datosAvionSnapshot.vencimientoSeguro).toLocaleDateString()}</p>}
            {orden.datosAvionSnapshot.certificadoMatricula && (
              <p>
                <span className="text-slate-500">Certificado matrícula:</span>{' '}
                <a
                  href={api(`/${orden.datosAvionSnapshot.certificadoMatricula}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                >
                  Ver archivo
                </a>
              </p>
            )}
          </div>
        )}

        {// Componente (snapshot) }
        {orden.datosComponenteSnapshot && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del componente externo al momento de la cancelanción
            </h3>
            {orden.datosComponenteSnapshot.tipo && <p><span className="text-slate-500">Tipo:</span> {orden.datosComponenteSnapshot.tipo}</p>}
            {orden.datosComponenteSnapshot.marca && <p><span className="text-slate-500">Marca:</span> {orden.datosComponenteSnapshot.marca}</p>}
            {orden.datosComponenteSnapshot.modelo && <p><span className="text-slate-500">Modelo:</span> {orden.datosComponenteSnapshot.modelo}</p>}
            {orden.datosComponenteSnapshot.numeroSerie && <p><span className="text-slate-500">Número de serie:</span> {orden.datosComponenteSnapshot.numeroSerie}</p>}
            {orden.datosComponenteSnapshot.numeroParte && <p><span className="text-slate-500">Número de parte:</span> {orden.datosComponenteSnapshot.numeroParte}</p>}
            {orden.datosComponenteSnapshot.TSN && <p><span className="text-slate-500">TSN:</span> {orden.datosComponenteSnapshot.TSN}</p>}
            {orden.datosComponenteSnapshot.TSO && <p><span className="text-slate-500">TSO:</span> {orden.datosComponenteSnapshot.TSO}</p>}
            {orden.datosComponenteSnapshot.TBO && <p><span className="text-slate-500">TBO:</span> {orden.datosComponenteSnapshot.TBO}</p>}
            {orden.datosComponenteSnapshot.fechaTBO && <p><span className="text-slate-500">Fecha TBO:</span> {orden.datosComponenteSnapshot.fechaTBO}</p>}
            {orden.datosComponenteSnapshot.archivo8130 && (
              <p>
                <span className="text-slate-500">Archivo 8130:</span>{' '}
                <a
                  href={api(`/${orden.datosComponenteSnapshot.archivo8130}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                >
                  Ver archivo
                </a>
              </p>
            )}
          </div>
        )}

        {// Propietario (snapshot) }
{esDeComponente && orden.datosPropietarioSnapshot && (() => {
  const p = orden.datosPropietarioSnapshot!;
  const esEmpresa = (p.tipo ?? '').toUpperCase() === 'EMPRESA'
    || (!!p.razonSocial || !!p.nombreEmpresa);

  // nombre para institución prioriza razonSocial, luego nombreEmpresa
  const nombreInstitucion = p.razonSocial || p.nombreEmpresa || '—';

  // contacto: mostramos teléfono o email si existen
  const hayTelefono = !!p.telefono;
  const hayEmail = !!p.email;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
      <h3 className="font-semibold text-slate-900 mb-1.5">
        Datos del propietario al momento de la cancelación
      </h3>

      {esEmpresa ? (
        <>
          <p>
            <span className="text-slate-500">Tipo:</span> Institución
          </p>
          <p>
            <span className="text-slate-500">Nombre empresa:</span> {nombreInstitucion}
          </p>
          {p.rut && (
            <p>
              <span className="text-slate-500">RUT:</span> {p.rut}
            </p>
          )}
          {(hayTelefono || hayEmail) && (
            <>
              {hayTelefono && (
                <p>
                  <span className="text-slate-500">Teléfono:</span> {p.telefono}
                </p>
              )}
              {hayEmail && (
                <p>
                  <span className="text-slate-500">Email:</span> {p.email}
                </p>
              )}
            </>
          )}
          {(!hayTelefono && !hayEmail) && (
            <p className="text-slate-500">Sin datos de contacto.</p>
          )}
        </>
      ) : (
        <>
          <p>
            <span className="text-slate-500">Tipo:</span> Persona
          </p>
          <p>
            <span className="text-slate-500">Nombre:</span> {p.nombre ?? '—'}
          </p>
          <p>
            <span className="text-slate-500">Apellido:</span> {p.apellido ?? '—'}
          </p>
          {(p.telefono || p.email) ? (
            <>
              {p.telefono && (
                <p>
                  <span className="text-slate-500">Teléfono:</span> {p.telefono}
                </p>
              )}
              {p.email && (
                <p>
                  <span className="text-slate-500">Email:</span> {p.email}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-500">Sin datos de contacto.</p>
          )}
        </>
      )}
    </div>
  );
})()}

      </section>

      {// CARD — Datos generales de la orden }
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Datos generales de la orden</h2>
        <div className="text-[15px] leading-7 space-y-1">
          {orden.solicitadoPor && <p><span className="text-slate-500">Solicitado por:</span> {orden.solicitadoPor}</p>}
          {orden.solicitud && <p><span className="text-slate-500">Descripción del trabajo solicitado:</span> {orden.solicitud}</p>}
          {orden.inspeccionRecibida !== undefined && (
            <p><span className="text-slate-500">¿Inspección recibida?</span> {orden.inspeccionRecibida ? 'Sí' : 'No'}</p>
          )}
          {orden.danosPrevios && <p><span className="text-slate-500">Daños previos:</span> {orden.danosPrevios}</p>}
          {orden.accionTomada && <p><span className="text-slate-500">Acción tomada:</span> {orden.accionTomada}</p>}
          {orden.observaciones && <p><span className="text-slate-500">Observaciones:</span> {orden.observaciones}</p>}
          {orden.solicitudFirma && (
  <p>
    <span className="text-slate-500">Archivo de solicitud:</span>{' '}
    <button
      type="button"
      onClick={() => verArchivo(orden.solicitudFirma)}
      className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      Ver archivo
    </button>
  </p>
)}
          {orden.fechaCierre && (
            <p><span className="text-slate-500">Fecha de cancelanción:</span> {new Date(orden.fechaCierre).toLocaleDateString()}</p>
          )}
        </div>
      </section>

      {// CARD — Herramientas }
      {orden.herramientas?.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Herramientas asignadas</h2>
          <ul className="list-disc ml-6 text-[15px] leading-7 text-slate-700">
            {orden.herramientas.map((h, i) => (
              <li key={i}>
                {h.herramienta.nombre}
                {(h.herramienta.marca || h.herramienta.modelo) &&
                  ` (${h.herramienta.marca ?? ''} ${h.herramienta.modelo ?? ''})`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {// CARD — Stock }
      {orden.stockAsignado?.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Stock utilizado</h2>
          <ul className="list-disc ml-6 text-[15px] leading-7 text-slate-700">
            {orden.stockAsignado.map((s, i) => (
              <li key={i}>
                {s.stock.nombre}
                {(s.stock.marca || s.stock.modelo) &&
                  ` (${s.stock.marca ?? ''} ${s.stock.modelo ?? ''})`}
                {' — '}
                {s.cantidadUtilizada} unidad(es)
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {// CARD — Personal }
      {orden.empleadosAsignados?.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Personal asignado</h2>
          <div className="space-y-3 text-[15px] leading-7">
            {orden.empleadosAsignados.map((asignacion, index) => {
              const registros = (orden.registrosTrabajo ?? []).filter(
                (r) =>
                  r.empleado.nombre === asignacion.empleado.nombre &&
                  r.empleado.apellido === asignacion.empleado.apellido
              );
              return (
                <div key={index}>
                  <p>
                    <span className="text-slate-500">
                      {asignacion.rol === 'TECNICO' ? 'Técnico' : 'Certificador'}:
                    </span>{' '}
                    {asignacion.empleado.nombre} {asignacion.empleado.apellido}
                  </p>
                  {registros.length > 0 && (
                    <ul className="ml-6 list-disc text-slate-700">
                      {registros.map((r, i) => (
                        <li key={i}>{new Date(r.fecha).toLocaleDateString()}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {// CARD — Datos de factura (si hubiera) }
      {(orden.numeroFactura || orden.archivoFactura || orden.estadoFactura) && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Datos de factura</h2>

          <div className="text-[15px] leading-7 space-y-1">
            {orden.numeroFactura && (
              <p><span className="text-slate-500">Número de factura:</span> {orden.numeroFactura}</p>
            )}
            {orden.estadoFactura && (
              <p>
                <span className="text-slate-500">Estado de factura:</span>{' '}
                {orden.estadoFactura === 'ENVIADA' ? 'Enviada' :
                 orden.estadoFactura === 'NO_ENVIADA' ? 'No enviada' :
                 orden.estadoFactura}
              </p>
            )}
           {orden.archivoFactura && (
  <p>
    <span className="text-slate-500">Archivo de factura:</span>{' '}
    <button
      type="button"
      onClick={() => verArchivo(orden.archivoFactura)}
      className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      Ver archivo
    </button>
  </p>
)}

          </div>
        </section>
      )}
    </main>
  </div>
);
}
*/






















'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchJson } from '@/services/api';

interface Empleado { nombre: string; apellido: string; }

interface EmpleadoAsignado {
  empleado: Empleado;
  rol: 'TECNICO' | 'CERTIFICADOR';
}

export default function OrdenCanceladaPage() {
  const { id } = useParams();
  const search = useSearchParams();
  const includeArchived =
    search.get('includeArchived') === '1' || search.get('includeArchived') === 'true';

  interface StockAsignado {
    stock: {
      nombre: string;
      marca?: string;
      modelo?: string;
    };
    cantidadUtilizada: number;
  }

  interface HerramientaAsignada {
    herramienta: {
      nombre: string;
      marca?: string;
      modelo?: string;
    };
  }

  interface RegistroTrabajo {
    empleado: {
      id?: number; // opcional por si lo traés (mejora el match)
      nombre: string;
      apellido: string;
    };
    horasTrabajadas: number;
    fecha: string;
    trabajoRealizado?: string | null;
    rol?: 'TECNICO' | 'CERTIFICADOR';
  }

  interface Avion {
    id: number;
    matricula?: string;
    marca?: string;
    modelo?: string;
    TSN?: string;
    TSO?: string;
    TBO?: string;
    fechaTBO?: string;
  }

  interface Componente {
    id: number;
    tipo?: string;
    marca?: string;
    modelo?: string;
    TSN?: string;
    TSO?: string;
    TBO?: string;
    fechaTBO?: string;
  }

  type ArchivoRef = {
    id: number;
    storageKey: string;
    mime?: string;
    originalName?: string;
    sizeAlmacen?: number;
  };

  type PropietarioSnap = {
    tipo?: 'PERSONA' | 'EMPRESA';
    nombre?: string;
    apellido?: string;
    cedula?: string;
    // empresa:
    razonSocial?: string;     // ← así viene del backend
    nombreEmpresa?: string;   // ← compat viejo si lo hubiese
    rut?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  };

  interface OrdenTrabajo {
    id: number;
    solicitadoPor?: string;
    solicitud?: string;
    solicitudFirma?: ArchivoRef | null;
    inspeccionRecibida?: boolean;
    danosPrevios?: string;
    accionTomada?: string;
    observaciones?: string;
    archivoFactura?: ArchivoRef | null;
    estadoFactura?: 'NO_ENVIADA' | 'ENVIADA' | 'PAGA' | 'PENDIENTE' | '';
    numeroFactura?: string | null;
    fechaApertura?: string;
    fechaCierre?: string;         // posible fallback si backend no expone fechaCancelacion
    fechaCancelacion?: string;    // ⬅️ agregado para canceladas

    datosAvionSnapshot?: {
      matricula?: string;
      marca?: string;
      modelo?: string;
      numeroSerie?: string;
      TSN?: string;
      TSO?: string;
      TBO?: string;
      fechaTBO?: string;
      vencimientoMatricula?: string;
      vencimientoSeguro?: string;
      certificadoMatricula?: string;
    };

    datosComponenteSnapshot?: {
      tipo?: string;
      marca?: string;
      modelo?: string;
      numeroSerie?: string;
      numeroParte?: string;
      TSN?: string;
      TSO?: string;
      TBO?: string;
      fechaTBO?: string;
      archivo8130?: string;
    };

    datosPropietarioSnapshot?: {
      tipo?: 'PERSONA' | 'EMPRESA';
      nombre?: string;
      apellido?: string;
      cedula?: string;
      nombreEmpresa?: string;
      rut?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    };

    empleadosAsignados?: EmpleadoAsignado[];
    stockAsignado?: StockAsignado[];
    herramientas?: HerramientaAsignada[];
    registrosTrabajo?: RegistroTrabajo[];
    avion?: Avion;
    componente?: Componente;
  }

  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);

  useEffect(() => {
    const qs = includeArchived ? '?includeArchived=1' : '';
    fetchJson<OrdenTrabajo>(`/ordenes-trabajo/${id}${qs}`)
      .then((data) => {
        setOrden(data);
      })
      .catch(err => console.error('Error al cargar orden:', err));
  }, [id, includeArchived]);

  if (!orden) return <p>Cargando...</p>;

  const esComponente = Boolean(orden.datosComponenteSnapshot || orden.componente);
  const esAvion = !esComponente && Boolean(orden.datosAvionSnapshot || orden.avion);
  const herramientas = orden.herramientas ?? [];
  const empleadosAsignados = orden.empleadosAsignados ?? [];
  const stockAsignado = orden.stockAsignado ?? [];
  const registrosTrabajo = orden.registrosTrabajo ?? [];

  // ===== Helpers de archivos =====
  async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
    const q = new URLSearchParams({ key, disposition }).toString();
    return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
  }

  async function verArchivo(key?: string) {
    if (!key) return;
    const win = window.open('about:blank', '_blank');
    try {
      const { url } = await obtenerUrlFirmada(key, 'inline');
      if (!url) { win?.close(); return; }
      setTimeout(() => win && (win.location.replace(url)), 60);
    } catch (e) {
      win?.close();
      console.error('❌ No se pudo abrir archivo:', e);
    }
  }

  async function descargarArchivo(key?: string) {
    if (!key) return;
    const win = window.open('about:blank', '_blank');
    try {
      const { url } = await obtenerUrlFirmada(key, 'attachment');
      if (!url) { win?.close(); return; }
      setTimeout(() => win && (win.location.replace(url)), 60);
    } catch (e) {
      win?.close();
      console.error('❌ No se pudo descargar archivo:', e);
    }
  }

  // ===== Render propietario =====
  function RenderPropietario({ p }: { p: PropietarioSnap }) {
    const esEmpresa = p.tipo === 'EMPRESA';
    const empresa = p.razonSocial ?? p.nombreEmpresa; // compat nombres
    return (
      <div className="space-y-1">
        {esEmpresa ? (
          <>
            {empresa && <p><span className="text-slate-500">Nombre empresa:</span> {empresa}</p>}
            {p.rut && <p><span className="text-slate-500">RUT:</span> {p.rut}</p>}
          </>
        ) : (
          <>
            {p.nombre && <p><span className="text-slate-500">Nombre:</span> {p.nombre}</p>}
            {p.apellido && <p><span className="text-slate-500">Apellido:</span> {p.apellido}</p>}
            {p.cedula && <p><span className="text-slate-500">Cédula:</span> {p.cedula}</p>}
          </>
        )}
        {p.telefono && <p><span className="text-slate-500">Teléfono:</span> {p.telefono}</p>}
        {p.email && <p><span className="text-slate-500">Email:</span> {p.email}</p>}
        {p.direccion && <p><span className="text-slate-500">Dirección:</span> {p.direccion}</p>}
      </div>
    );
  }

  // ===== Render =====
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Orden de trabajo #{orden.id} (cancelada)
        </h1>

        {/* CARD — Resumen */}
        {esAvion && orden.datosAvionSnapshot && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del avión al momento de la cancelación
            </h3>
            {orden.datosAvionSnapshot.matricula && (
              <p><span className="text-slate-500">Matrícula:</span> {orden.datosAvionSnapshot.matricula}</p>
            )}
            {orden.datosAvionSnapshot.marca && (
              <p><span className="text-slate-500">Marca:</span> {orden.datosAvionSnapshot.marca}</p>
            )}
            {orden.datosAvionSnapshot.modelo && (
              <p><span className="text-slate-500">Modelo:</span> {orden.datosAvionSnapshot.modelo}</p>
            )}
            {orden.datosAvionSnapshot.numeroSerie && (
              <p><span className="text-slate-500">Número de serie:</span> {orden.datosAvionSnapshot.numeroSerie}</p>
            )}
            {orden.datosAvionSnapshot.TSN && (
              <p><span className="text-slate-500">TSN:</span> {orden.datosAvionSnapshot.TSN}</p>
            )}
            {orden.datosAvionSnapshot.TSO && (
              <p><span className="text-slate-500">TSO:</span> {orden.datosAvionSnapshot.TSO}</p>
            )}
            {orden.datosAvionSnapshot.TBO && (
              <p><span className="text-slate-500">TBO:</span> {orden.datosAvionSnapshot.TBO}</p>
            )}
            {orden.datosAvionSnapshot.fechaTBO && (
              <p><span className="text-slate-500">Fecha TBO:</span> {orden.datosAvionSnapshot.fechaTBO}</p>
            )}
            {orden.datosAvionSnapshot.vencimientoMatricula && (
              <p>
                <span className="text-slate-500">Vencimiento matrícula:</span>{" "}
                {new Date(orden.datosAvionSnapshot.vencimientoMatricula).toLocaleDateString("es-UY")}
              </p>
            )}
            {orden.datosAvionSnapshot.vencimientoSeguro && (
              <p>
                <span className="text-slate-500">Vencimiento seguro:</span>{" "}
                {new Date(orden.datosAvionSnapshot.vencimientoSeguro).toLocaleDateString("es-UY")}
              </p>
            )}
            {orden.datosAvionSnapshot.certificadoMatricula && (
              <p className="mt-1 text-[14px] leading-6">
                <span className="text-slate-500">Certificado matrícula: </span>
                <button
                  type="button"
                  onClick={() => verArchivo(orden.datosAvionSnapshot!.certificadoMatricula!)}
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                >
                  Ver
                </button>
                <span className="mx-2">·</span>
                <button
                  type="button"
                  onClick={() => descargarArchivo(orden.datosAvionSnapshot!.certificadoMatricula!)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-2 py-0.5 text-[13px] text-slate-700 hover:bg-slate-50 ml-1"
                >
                  Descargar
                </button>
              </p>
            )}
          </div>
        )}

        {esComponente && orden.datosComponenteSnapshot && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Componente externo al momento de la cancelación
            </h3>
            {orden.datosComponenteSnapshot.tipo && (
              <p><span className="text-slate-500">Tipo:</span> {orden.datosComponenteSnapshot.tipo}</p>
            )}
            {orden.datosComponenteSnapshot.marca && (
              <p><span className="text-slate-500">Marca:</span> {orden.datosComponenteSnapshot.marca}</p>
            )}
            {orden.datosComponenteSnapshot.modelo && (
              <p><span className="text-slate-500">Modelo:</span> {orden.datosComponenteSnapshot.modelo}</p>
            )}
            {orden.datosComponenteSnapshot.numeroSerie && (
              <p><span className="text-slate-500">Número de serie:</span> {orden.datosComponenteSnapshot.numeroSerie}</p>
            )}
            {orden.datosComponenteSnapshot.numeroParte && (
              <p><span className="text-slate-500">Número de parte:</span> {orden.datosComponenteSnapshot.numeroParte}</p>
            )}
            {orden.datosComponenteSnapshot.TSN && (
              <p><span className="text-slate-500">TSN:</span> {orden.datosComponenteSnapshot.TSN}</p>
            )}
            {orden.datosComponenteSnapshot.TSO && (
              <p><span className="text-slate-500">TSO:</span> {orden.datosComponenteSnapshot.TSO}</p>
            )}
            {orden.datosComponenteSnapshot.TBO && (
              <p><span className="text-slate-500">TBO:</span> {orden.datosComponenteSnapshot.TBO}</p>
            )}
            {orden.datosComponenteSnapshot.fechaTBO && (
              <p><span className="text-slate-500">Fecha TBO:</span> {orden.datosComponenteSnapshot.fechaTBO}</p>
            )}

            {orden.datosComponenteSnapshot.archivo8130 && (
              <p className="mt-1 text-[14px] leading-6">
                <span className="text-slate-500">Archivo 8130: </span>
                <button
                  type="button"
                  onClick={() => verArchivo(orden.datosComponenteSnapshot!.archivo8130!)}
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                >
                  Ver
                </button>
                <span className="mx-2">·</span>
                <button
                  type="button"
                  onClick={() => descargarArchivo(orden.datosComponenteSnapshot!.archivo8130!)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-2 py-0.5 text-[13px] text-slate-700 hover:bg-slate-50 ml-1"
                >
                  Descargar
                </button>
              </p>
            )}
          </div>
        )}

        {esComponente && orden.datosPropietarioSnapshot && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del propietario al momento de la cancelación
            </h3>
            <RenderPropietario p={orden.datosPropietarioSnapshot as any} />
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Datos generales de la orden</h2>

          <div className="text-[15px] leading-7 space-y-1">
            {orden.fechaApertura && (
              <p>
                <span className="text-slate-500">Fecha de apertura:</span>{" "}
                {new Date(orden.fechaApertura).toLocaleDateString("es-UY")}
              </p>
            )}

            {(orden.fechaCancelacion || orden.fechaCierre) && (
              <p>
                <span className="text-slate-500">Fecha de cancelación:</span>{" "}
                {new Date(orden.fechaCancelacion ?? orden.fechaCierre!).toLocaleDateString("es-UY")}
              </p>
            )}

            {orden.solicitadoPor && (
              <p>
                <span className="text-slate-500">Solicitado por:</span> {orden.solicitadoPor}
              </p>
            )}

            {orden.solicitud && (
              <p>
                <span className="text-slate-500">Descripción del trabajo solicitado:</span>{" "}
                {orden.solicitud}
              </p>
            )}

            {orden.inspeccionRecibida !== undefined && (
              <p>
                <span className="text-slate-500">¿Inspección recibida?</span>{" "}
                {orden.inspeccionRecibida ? "Sí" : "No"}
              </p>
            )}

            {orden.danosPrevios && (
              <p>
                <span className="text-slate-500">Daños previos:</span> {orden.danosPrevios}
              </p>
            )}

            {orden.accionTomada && (
              <p>
                <span className="text-slate-500">Acción tomada:</span> {orden.accionTomada}
              </p>
            )}

            {orden.observaciones && (
              <p>
                <span className="text-slate-500">Observaciones:</span> {orden.observaciones}
              </p>
            )}

            {orden.solicitudFirma?.storageKey && (
              <p className="mt-2 text-[14px] leading-6">
                <span className="text-slate-500">Archivo de solicitud: </span>
                <button
                  type="button"
                  onClick={() => verArchivo(orden.solicitudFirma!.storageKey)}
                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                >
                  Ver
                </button>
                <span className="mx-2">·</span>
                <button
                  type="button"
                  onClick={() => descargarArchivo(orden.solicitudFirma!.storageKey)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-2 py-0.5 text-[13px] text-slate-700 hover:bg-slate-50 ml-1"
                >
                  Descargar
                </button>
              </p>
            )}
          </div>
        </section>

        {/* CARD — Herramientas */}
        {herramientas.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Herramientas asignadas</h2>
            <ul className="list-disc ml-6 text-[15px] leading-7 text-slate-700">
              {herramientas.map((h, i) => (
                <li key={i}>
                  {h.herramienta.nombre}
                  {(h.herramienta.marca || h.herramienta.modelo) &&
                    ` (${h.herramienta.marca ?? ''} ${h.herramienta.modelo ?? ''})`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CARD — Stock */}
        {stockAsignado.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Stock utilizado</h2>
            <ul className="list-disc ml-6 text-[15px] leading-7 text-slate-700">
              {stockAsignado.map((s, i) => (
                <li key={i}>
                  {s.stock.nombre}
                  {(s.stock.marca || s.stock.modelo) &&
                    ` (${s.stock.marca ?? ''} ${s.stock.modelo ?? ''})`}
                  {' — '}
                  {s.cantidadUtilizada} unidad(es)
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CARD — Personal */}
        {empleadosAsignados.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Personal asignado</h2>

            <div className="space-y-3 text-[15px] leading-7">
              {empleadosAsignados.map((asignacion, index) => {
                // normaliza para comparar (sin acentos, trim, lower)
                const norm = (s: string) =>
                  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

                const registrosEmpleado = registrosTrabajo.filter((r) =>
                  norm(r.empleado.nombre) === norm(asignacion.empleado.nombre) &&
                  norm(r.empleado.apellido) === norm(asignacion.empleado.apellido)
                );

                const fmtFecha = (d: string) => new Date(d).toLocaleDateString('es-UY');

                return (
                  <div key={index} className="pb-2 border-b last:border-b-0 border-slate-100">
                    <p>
                      <span className="text-slate-500">
                        {asignacion.rol === 'TECNICO' ? 'Técnico' : 'Certificador'}:
                      </span>{' '}
                      {asignacion.empleado.nombre} {asignacion.empleado.apellido}
                    </p>

                    {registrosEmpleado.length > 0 && (
                      <ul className="mt-1 ml-6 list-disc text-slate-700">
                        {registrosEmpleado.map((r, i) => (
                          <li key={`${r.fecha}-${i}`}>
                            <span className="text-slate-500">{fmtFecha(r.fecha)}:</span>{' '}
                            <span>{Number(r.horasTrabajadas).toFixed(2)} h — </span>
                            <span>{r.trabajoRealizado?.trim() || 'Sin detalle'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CARD — Factura (solo lectura en cancelada) */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Factura</h2>

          <div className="mt-2 text-[15px] leading-7 space-y-1">
            <p>
              <span className="text-slate-500">Estado:</span>{' '}
              <span className="font-medium">
                {orden.estadoFactura === 'PAGA'
                  ? 'Paga'
                  : orden.estadoFactura === 'ENVIADA'
                  ? 'Enviada'
                  : orden.estadoFactura === 'NO_ENVIADA'
                  ? 'No enviada'
                  : orden.estadoFactura || '—'}
              </span>
            </p>

            {orden.numeroFactura && (
              <p>
                <span className="text-slate-500">Número de factura:</span>{' '}
                {orden.numeroFactura}
              </p>
            )}

            {orden.archivoFactura?.storageKey ? (
              <div className="mt-2 flex items-center gap-3 text-[14px] leading-6">
                <button
                  type="button"
                  onClick={() => verArchivo(orden.archivoFactura!.storageKey)}
                  className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                >
                  👁️ Ver factura
                </button>
                <button
                  type="button"
                  onClick={() => descargarArchivo(orden.archivoFactura!.storageKey)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Descargar
                </button>
              </div>
            ) : (
              <p className="text-slate-500">Sin archivo de factura.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
