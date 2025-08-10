'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function OrdenCanceladaPage() {
  const { id } = useParams();

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
  numeroFactura?: string;
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

  useEffect(() => {
    fetch(api(`/ordenes-trabajo/${id}`))
      .then(res => res.json())
      .then(data => {
        setOrden(data);
      })
      .catch(err => console.error('Error al cargar orden:', err));
  }, [id]);

  if (!orden) return <p className="p-4">Cargando orden cancelada...</p>;

    return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Orden de trabajo #{orden.id} (cancelada)</h1>

      <div className="bg-gray-50 p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Resumen</h2>

       {/* 🔷 Datos del avión (snapshot) */}
{orden.datosAvionSnapshot && (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-1">
    <h2 className="font-semibold text-lg">Datos del avión al momento del cierre</h2>
    {orden.datosAvionSnapshot.matricula && <p><strong>Matrícula:</strong> {orden.datosAvionSnapshot.matricula}</p>}
    {orden.datosAvionSnapshot.marca && <p><strong>Marca:</strong> {orden.datosAvionSnapshot.marca}</p>}
    {orden.datosAvionSnapshot.modelo && <p><strong>Modelo:</strong> {orden.datosAvionSnapshot.modelo}</p>}
    {orden.datosAvionSnapshot.numeroSerie && <p><strong>Número de serie:</strong> {orden.datosAvionSnapshot.numeroSerie}</p>}
    {orden.datosAvionSnapshot.TSN && <p><strong>TSN:</strong> {orden.datosAvionSnapshot.TSN}</p>}
    {orden.datosAvionSnapshot.TSO && <p><strong>TSO:</strong> {orden.datosAvionSnapshot.TSO}</p>}
    {orden.datosAvionSnapshot.TBO && <p><strong>TBO:</strong> {orden.datosAvionSnapshot.TBO}</p>}
    {orden.datosAvionSnapshot.fechaTBO && <p><strong>Fecha TBO:</strong> {orden.datosAvionSnapshot.fechaTBO}</p>}
    {orden.datosAvionSnapshot.vencimientoMatricula && <p><strong>Vencimiento matrícula:</strong> {new Date(orden.datosAvionSnapshot.vencimientoMatricula).toLocaleDateString()}</p>}
    {orden.datosAvionSnapshot.vencimientoSeguro && <p><strong>Vencimiento seguro:</strong> {new Date(orden.datosAvionSnapshot.vencimientoSeguro).toLocaleDateString()}</p>}
    {orden.datosAvionSnapshot.certificadoMatricula && (
      <p>
        <strong>Certificado matrícula:</strong>{' '}
        <a href={`/${orden.datosAvionSnapshot.certificadoMatricula}`} target="_blank" className="text-blue-600 underline">
          Ver archivo
        </a>
      </p>
    )}
  </div>
)}

{/* 🔶 Datos del componente externo (snapshot) */}
{orden.datosComponenteSnapshot && (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-1">
    <h2 className="font-semibold text-lg">Datos del componente externo al momento del cierre</h2>
    {orden.datosComponenteSnapshot.tipo && <p><strong>Tipo:</strong> {orden.datosComponenteSnapshot.tipo}</p>}
    {orden.datosComponenteSnapshot.marca && <p><strong>Marca:</strong> {orden.datosComponenteSnapshot.marca}</p>}
    {orden.datosComponenteSnapshot.modelo && <p><strong>Modelo:</strong> {orden.datosComponenteSnapshot.modelo}</p>}
    {orden.datosComponenteSnapshot.numeroSerie && <p><strong>Número de serie:</strong> {orden.datosComponenteSnapshot.numeroSerie}</p>}
    {orden.datosComponenteSnapshot.numeroParte && <p><strong>Número de parte:</strong> {orden.datosComponenteSnapshot.numeroParte}</p>}
    {orden.datosComponenteSnapshot.TSN && <p><strong>TSN:</strong> {orden.datosComponenteSnapshot.TSN}</p>}
    {orden.datosComponenteSnapshot.TSO && <p><strong>TSO:</strong> {orden.datosComponenteSnapshot.TSO}</p>}
    {orden.datosComponenteSnapshot.TBO && <p><strong>TBO:</strong> {orden.datosComponenteSnapshot.TBO}</p>}
    {orden.datosComponenteSnapshot.fechaTBO && <p><strong>Fecha TBO:</strong> {orden.datosComponenteSnapshot.fechaTBO}</p>}
    {orden.datosComponenteSnapshot.archivo8130 && (
      <p>
        <strong>Archivo 8130:</strong>{' '}
        <a href={api(`/${orden.datosComponenteSnapshot.archivo8130}`)} target="_blank" className="text-blue-600 underline">
          Ver archivo
        </a>
      </p>
    )}
  </div>
)}

{/* 🟢 Datos del propietario (snapshot) */}
{orden.datosPropietarioSnapshot && (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-1">
    <h2 className="font-semibold text-lg">Datos del propietario al momento del cierre</h2>
    {orden.datosPropietarioSnapshot.tipo === 'EMPRESA'
      ? (
        <>
          {orden.datosPropietarioSnapshot.nombreEmpresa && <p><strong>Nombre empresa:</strong> {orden.datosPropietarioSnapshot.nombreEmpresa}</p>}
          {orden.datosPropietarioSnapshot.rut && <p><strong>RUT:</strong> {orden.datosPropietarioSnapshot.rut}</p>}
        </>
      ) : (
        <>
          {orden.datosPropietarioSnapshot.nombre && <p><strong>Nombre:</strong> {orden.datosPropietarioSnapshot.nombre}</p>}
          {orden.datosPropietarioSnapshot.apellido && <p><strong>Apellido:</strong> {orden.datosPropietarioSnapshot.apellido}</p>}
          {orden.datosPropietarioSnapshot.cedula && <p><strong>Cédula:</strong> {orden.datosPropietarioSnapshot.cedula}</p>}
        </>
      )
    }
    {orden.datosPropietarioSnapshot.telefono && <p><strong>Teléfono:</strong> {orden.datosPropietarioSnapshot.telefono}</p>}
    {orden.datosPropietarioSnapshot.email && <p><strong>Email:</strong> {orden.datosPropietarioSnapshot.email}</p>}
    {orden.datosPropietarioSnapshot.direccion && <p><strong>Dirección:</strong> {orden.datosPropietarioSnapshot.direccion}</p>}
  </div>
)}

{/* 🔷 Datos generales de la orden */}
<div className="mt-6 bg-white p-4 rounded shadow space-y-1">
  <h2 className="font-semibold text-lg">Datos generales de la orden</h2>

  {orden.solicitadoPor && (
    <p>
      <strong>Solicitado por:</strong> {orden.solicitadoPor}
    </p>
  )}
  {orden.solicitud && (
    <p>
      <strong>Descripción del trabajo solicitado:</strong> {orden.solicitud}
    </p>
  )}
  {orden.inspeccionRecibida !== undefined && (
    <p>
      <strong>¿Inspección recibida?</strong> {orden.inspeccionRecibida ? 'Sí' : 'No'}
    </p>
  )}
  {orden.danosPrevios && (
    <p>
      <strong>Daños previos:</strong> {orden.danosPrevios}
    </p>
  )}
  {orden.accionTomada && (
    <p>
      <strong>Acción tomada:</strong> {orden.accionTomada}
    </p>
  )}
  {orden.observaciones && (
    <p>
      <strong>Observaciones:</strong> {orden.observaciones}
    </p>
  )}
  {orden.solicitudFirma && (
    <p>
      <strong>Archivo de solicitud:</strong>{' '}
      <a href={orden.solicitudFirma} target="_blank" className="text-blue-600 underline">
        Ver archivo
      </a>
    </p>
  )}
  {orden.fechaCierre && (
  <p><strong>Fecha de cierre:</strong> {new Date(orden.fechaCierre).toLocaleDateString()}</p>
)}

</div>

{orden.herramientas?.length ? (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-1">
    <h2 className="font-semibold text-lg">Herramientas asignadas</h2>

    {orden.herramientas.map((h: HerramientaAsignada, index: number) => (
      <p key={index}>
        <strong>{h.herramienta.nombre}</strong>
        {h.herramienta.marca && ` - ${h.herramienta.marca}`}
        {h.herramienta.modelo && ` - ${h.herramienta.modelo}`}
      </p>
    ))}
  </div>
) : null}

{orden.stockAsignado?.length ? (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-1">
    <h2 className="font-semibold text-lg">Stock utilizado</h2>

    {orden.stockAsignado.map((s: StockAsignado, index: number) => (
      <p key={index}>
        <strong>{s.stock.nombre}</strong>
        {s.stock.marca && ` - ${s.stock.marca}`}
        {s.stock.modelo && ` - ${s.stock.modelo}`}
        {' — '}
        <strong>Cantidad usada:</strong> {s.cantidadUtilizada}
      </p>
    ))}
  </div>
) : null}

{orden.empleadosAsignados?.length ? (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-2">
    <h2 className="font-semibold text-lg">Personal asignado</h2>

    {orden.empleadosAsignados.map((asignacion: EmpleadoAsignado, index: number) => {
      const registros = orden.registrosTrabajo?.filter(
        (r) =>
          r.empleado.nombre === asignacion.empleado.nombre &&
          r.empleado.apellido === asignacion.empleado.apellido
      ) || [];

      return (
        <div key={index}>
          <p>
            <strong>{asignacion.rol === 'TECNICO' ? 'Técnico' : 'Certificador'}:</strong>{' '}
            {asignacion.empleado.nombre} {asignacion.empleado.apellido}
          </p>
          {registros.length > 0 && (
            <ul className="ml-4 text-sm list-disc text-gray-700">
              {registros.map((r, i) => (
                <li key={i}>
                  {new Date(r.fecha).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    })}
  </div>
) : null}
{(orden.numeroFactura || orden.archivoFactura || orden.estadoFactura) && (
  <div className="mt-6 bg-white p-4 rounded shadow space-y-1">
    <h2 className="font-semibold text-lg">Datos de factura</h2>

    {orden.numeroFactura && (
      <p>
        <strong>Número de factura:</strong> {orden.numeroFactura}
      </p>
    )}

    {orden.estadoFactura && (
      <p>
        <strong>Estado de factura:</strong>{' '}
        {orden.estadoFactura === 'ENVIADA' ? 'Enviada' :
         orden.estadoFactura === 'NO_ENVIADA' ? 'No enviada' :
         orden.estadoFactura}
      </p>
    )}

    {orden.archivoFactura && (
      <p>
        <strong>Archivo de factura:</strong>{' '}
        <a href={`/${orden.archivoFactura}`} target="_blank" className="text-blue-600 underline">
          Ver archivo
        </a>
      </p>
    )}
  </div>
)}
      </div>
      </div>
    );
  } 