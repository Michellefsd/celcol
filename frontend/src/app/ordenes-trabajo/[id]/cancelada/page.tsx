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
    empleadosAsignados?: EmpleadoAsignado[];
    stockAsignado?: StockAsignado[];
    herramientas?: HerramientaAsignada[];
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
      <p className="italic text-gray-500">Esta orden fue cancelada y no puede modificarse.</p>

      <div className="bg-gray-50 p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Resumen</h2>

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
            {orden.avion.TSN && <p><strong>TSN:</strong> {orden.avion.TSN}</p>}
            {orden.avion.TSO && <p><strong>TSO:</strong> {orden.avion.TSO}</p>}
            {orden.avion.TBO && <p><strong>TBO:</strong> {orden.avion.TBO}</p>}
            {orden.avion.fechaTBO && <p><strong>Fecha TBO:</strong> {orden.avion.fechaTBO}</p>}
          </>
        )}

        {orden.componente && (
          <>
            <p>
              <strong>Componente externo:</strong>{' '}
              <a
                href={`/cruds/propietarios/${orden.componente.id}`}
                className="text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {orden.componente.tipo} - {orden.componente.marca} {orden.componente.modelo}
              </a>
            </p>
            {orden.componente.TSN && <p><strong>TSN:</strong> {orden.componente.TSN}</p>}
            {orden.componente.TSO && <p><strong>TSO:</strong> {orden.componente.TSO}</p>}
            {orden.componente.TBO && <p><strong>TBO:</strong> {orden.componente.TBO}</p>}
            {orden.componente.fechaTBO && <p><strong>Fecha TBO:</strong> {orden.componente.fechaTBO}</p>}
          </>
        )}

        <p><strong>Solicitado por:</strong> {orden.solicitadoPor}</p>
        {orden.solicitud && (
          <p>
            <strong>Solicitud:</strong>{' '}
            <a href={orden.solicitud} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Ver solicitud</a>
          </p>
        )}
        {orden.solicitudFirma && (
          <p>
            <strong>Archivo solicitud:</strong>{' '}
            <a href={orden.solicitudFirma} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Ver archivo</a>
          </p>
        )}
        <p><strong>Inspección recibida:</strong> {orden.inspeccionRecibida ? 'Sí' : 'No'}</p>
        <p><strong>Daños previos:</strong> {orden.danosPrevios}</p>
        <p><strong>Acción tomada:</strong> {orden.accionTomada}</p>
        <p><strong>Observaciones:</strong> {orden.observaciones}</p>

        {orden.empleadosAsignados && orden.empleadosAsignados.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Personal asignado:</h3>
            {orden.empleadosAsignados.some((e) => e.rol === 'CERTIFICADOR') && (
              <div>
                <strong>Certificadores:</strong>
                <ul className="list-disc ml-6">
                  {orden.empleadosAsignados
                    .filter((e) => e.rol === 'CERTIFICADOR')
                    .map((e, i) => (
                      <li key={`cert-${i}`}>
                        {e.empleado.nombre} {e.empleado.apellido}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {orden.empleadosAsignados.some((e) => e.rol === 'TECNICO') && (
              <div>
                <strong>Técnicos:</strong>
                <ul className="list-disc ml-6">
                  {orden.empleadosAsignados
                    .filter((e) => e.rol === 'TECNICO')
                    .map((e, i) => (
                      <li key={`tec-${i}`}>
                        {e.empleado.nombre} {e.empleado.apellido}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {orden.stockAsignado && orden.stockAsignado.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Stock utilizado:</h3>
            <ul className="list-disc ml-6">
              {orden.stockAsignado.map((s, i) => (
                <li key={`stock-${i}`}>
                  {s.stock.nombre}
                  {(s.stock.marca || s.stock.modelo) && ` (${s.stock.marca ?? ''} ${s.stock.modelo ?? ''})`}
                  {' - '}
                  {s.cantidadUtilizada} unidad(es)
                </li>
              ))}
            </ul>
          </div>
        )}

        {orden.herramientas && orden.herramientas.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Herramientas utilizadas:</h3>
            <ul className="list-disc ml-6">
              {orden.herramientas.map((h, i) => (
                <li key={`herr-${i}`}>
                  {h.herramienta.nombre}
                  {(h.herramienta.marca || h.herramienta.modelo) && ` (${h.herramienta.marca ?? ''} ${h.herramienta.modelo ?? ''})`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}