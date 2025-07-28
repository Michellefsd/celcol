'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';

export default function OrdenCerradaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orden, setOrden] = useState<any>(null);
  const [estadoFactura, setEstadoFactura] = useState('PENDIENTE');
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);

  useEffect(() => {
    fetch(api(`/ordenes-trabajo/${id}`))
      .then(res => res.json())
      .then(data => {
        setOrden(data);
        setEstadoFactura(data.estadoFactura ?? 'PENDIENTE');
      })
      .catch(err => console.error('Error al cargar orden:', err));
  }, [id]);

  const handleGuardarFactura = async () => {
    const res = await fetch(api(`/ordenes-trabajo/${id}/factura`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoFactura }),
    });

    if (res.ok) {
      alert('Factura actualizada');
      router.refresh();
    } else {
      alert('Error al guardar');
    }
  };

  if (!orden) return <p>Cargando...</p>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Orden de trabajo #{orden.id} (cerrada)</h1>

      <div className="bg-gray-50 p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Resumen</h2>
        <p><strong>Solicitado por:</strong> {orden.solicitadoPor}</p>
        <p><strong>Solicitud:</strong> {orden.solicitud}</p>
        <p><strong>Inspección recibida:</strong> {orden.inspeccionRecibida ? 'Sí' : 'No'}</p>
        <p><strong>Daños previos:</strong> {orden.danosPrevios}</p>
        <p><strong>Acción tomada:</strong> {orden.accionTomada}</p>
        <p><strong>Observaciones:</strong> {orden.observaciones}</p>
      </div>

      {/* Factura */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Factura</h2>
        <label className="block mb-2">Estado de la factura:</label>
        <select
          className="border px-3 py-1 rounded"
          value={estadoFactura}
          onChange={(e) => setEstadoFactura(e.target.value)}
        >
          <option value="PENDIENTE">Pendiente</option>
          <option value="FACTURADA">Facturada</option>
          <option value="PAGADA">Pagada</option>
        </select>

        <div className="mt-4">
          <button
            onClick={handleGuardarFactura}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Guardar estado
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setMostrarSubirFactura(true)}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            {orden.archivoFactura ? 'Ver / reemplazar factura' : 'Subir archivo de factura'}
          </button>

          {orden.archivoFactura && (
            <p className="mt-2 text-sm">
              Actual: <a href={orden.archivoFactura} target="_blank" className="text-blue-600 underline">ver</a>
            </p>
          )}

          <SubirArchivo
            open={mostrarSubirFactura}
            onClose={() => setMostrarSubirFactura(false)}
            url={api(`/ordenes-trabajo/${id}/factura`)}
          />
        </div>
      </div>
    </div>
  );
}
