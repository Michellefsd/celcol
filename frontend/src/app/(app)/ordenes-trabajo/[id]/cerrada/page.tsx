'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, fetchJson } from '@/services/api';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';

export default function OrdenCerradaPage() {
  const { id } = useParams();
  const router = useRouter();

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
  solicitudFirma?: string;
  inspeccionRecibida?: boolean;
  danosPrevios?: string;
  accionTomada?: string;
  observaciones?: string;
  archivoFactura?: string;
  estadoFactura?: string;
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
  const [estadoFactura, setEstadoFactura] = useState('PENDIENTE');
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);

  useEffect(() => {
    fetchJson<any>(`/ordenes-trabajo/${id}`)
      .then((data) => {
        setOrden(data);
        setEstadoFactura(data.estadoFactura ?? 'PENDIENTE');
      })
      .catch(err => console.error('Error al cargar orden:', err));
  }, [id]);

const handleGuardarFactura = async () => {
    try {
      await fetchJson(`/ordenes-trabajo/${id}/factura`, {
        method: 'POST',
        body: JSON.stringify({ estadoFactura }),
      });
      alert('Factura actualizada');
      router.refresh();
    } catch (e: any) {
      alert(e?.body?.error || e?.message || 'Error al guardar');
    }
  };

  if (!orden) return <p>Cargando...</p>;
const herramientas = orden.herramientas ?? [];
const empleadosAsignados = orden.empleadosAsignados ?? [];
const stockAsignado = orden.stockAsignado ?? [];
const registrosTrabajo = orden.registrosTrabajo ?? [];

return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Orden de trabajo #{orden.id} (cerrada)
      </h1>

      {/* CARD — Resumen */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Resumen</h2>

        {/* 🔷 Datos del avión (snapshot) */}
        {orden.datosAvionSnapshot && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del avión al momento del cierre
            </h3>
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

        {/* 🔶 Datos del componente externo (snapshot) */}
        {orden.datosComponenteSnapshot && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del componente externo al momento del cierre
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

        {/* 🟢 Datos del propietario (snapshot) */}
        {orden.datosPropietarioSnapshot && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-7">
            <h3 className="font-semibold text-slate-900 mb-1.5">
              Datos del propietario al momento del cierre
            </h3>
            {orden.datosPropietarioSnapshot.tipo === 'EMPRESA' ? (
              <>
                {orden.datosPropietarioSnapshot.nombreEmpresa && <p><span className="text-slate-500">Nombre empresa:</span> {orden.datosPropietarioSnapshot.nombreEmpresa}</p>}
                {orden.datosPropietarioSnapshot.rut && <p><span className="text-slate-500">RUT:</span> {orden.datosPropietarioSnapshot.rut}</p>}
              </>
            ) : (
              <>
                {orden.datosPropietarioSnapshot.nombre && <p><span className="text-slate-500">Nombre:</span> {orden.datosPropietarioSnapshot.nombre}</p>}
                {orden.datosPropietarioSnapshot.apellido && <p><span className="text-slate-500">Apellido:</span> {orden.datosPropietarioSnapshot.apellido}</p>}
                {orden.datosPropietarioSnapshot.cedula && <p><span className="text-slate-500">Cédula:</span> {orden.datosPropietarioSnapshot.cedula}</p>}
              </>
            )}
            {orden.datosPropietarioSnapshot.telefono && <p><span className="text-slate-500">Teléfono:</span> {orden.datosPropietarioSnapshot.telefono}</p>}
            {orden.datosPropietarioSnapshot.email && <p><span className="text-slate-500">Email:</span> {orden.datosPropietarioSnapshot.email}</p>}
            {orden.datosPropietarioSnapshot.direccion && <p><span className="text-slate-500">Dirección:</span> {orden.datosPropietarioSnapshot.direccion}</p>}
          </div>
        )}
      </section>

      {/* CARD — Datos generales de la orden */}
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
              <a
                href={orden.solicitudFirma}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
              >
                Ver archivo
              </a>
            </p>
          )}
          {orden.fechaCierre && (
            <p><span className="text-slate-500">Fecha de cierre:</span> {new Date(orden.fechaCierre).toLocaleDateString()}</p>
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
              const registros = registrosTrabajo.filter(
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
      )}

      {/* CARD — Factura */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Factura</h2>

        <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Estado de la factura</label>
        <select
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={estadoFactura}
          onChange={(e) => setEstadoFactura(e.target.value)}
        >
          <option value="PENDIENTE">Pendiente</option>
          <option value="FACTURADA">Facturada</option>
          <option value="PAGADA">Pagada</option>
        </select>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleGuardarFactura}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-4 py-2 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
          >
            Guardar estado
          </button>

          <button
            onClick={() => setMostrarSubirFactura(true)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                       px-4 py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                       transform hover:scale-[1.02] transition-all duration-200"
          >
            {orden.archivoFactura ? 'Ver / reemplazar factura' : 'Subir archivo de factura'}
          </button>
        </div>

        {orden.archivoFactura && (
          <p className="mt-2 text-[14px] leading-6">
            <span className="text-slate-500">Actual: </span>
            <a
              href={orden.archivoFactura}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
            >
              ver
            </a>
          </p>
        )}

        <SubirArchivo
          open={mostrarSubirFactura}
          onClose={() => setMostrarSubirFactura(false)}
          url={`/ordenes-trabajo/${id}/factura`}
        />
      </section>
    </main>
  </div>
);
}
