'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Fase2OrdenTrabajoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orden, setOrden] = useState<any>(null);
  const [solicitud, setSolicitud] = useState('');
  const [solicitadoPor, setSolicitadoPor] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);

  useEffect(() => {
    fetch(api(`/ordenes-trabajo/${id}`))
      .then(res => res.json())
      .then(data => {
        setOrden(data);
        setSolicitud(data.solicitud ?? '');
        setSolicitadoPor(data.solicitadoPor ?? '');
      })
      .catch(err => console.error('Error cargando orden de trabajo:', err));
  }, [id]);

  const handleGuardar = async (redirect: boolean = false): Promise<void> => {
    const formData = new FormData();
    formData.append('solicitud', solicitud);
    formData.append('solicitadoPor', solicitadoPor);
    if (archivo) {
      formData.append('archivo', archivo);
    }

    const res = await fetch(api(`/ordenes-trabajo/${id}/fase2`), {
      method: 'PUT',
      body: formData,
    });

    if (res.ok) {
      if (redirect) {
        router.push(`/ordenes-trabajo/${id}/fase3`);
      } else {
        alert('Datos guardados correctamente');
        const updated = await res.json();
        setOrden(updated);
      }
    } else {
      alert('Error al guardar');
    }
  };

  function renderCampo(label: string, valor: any) {
    if (valor === null || valor === undefined || valor === '') return null;
    return (
      <p>
        <strong>{label}:</strong> {valor}
      </p>
    );
  }

  if (!orden) return <p className="p-4">Cargando orden...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Fase 2: Detalles de la orden #{orden.id}</h1>

      <div className="bg-gray-100 p-4 rounded space-y-3">
        <p><strong>Tipo:</strong> {orden.avionId ? 'Avión' : 'Componente externo'}</p>

        {orden.avion && (
          <div>
            {renderCampo('Matrícula', orden.avion.matricula)}
            {renderCampo('Marca', orden.avion.marca)}
            {renderCampo('Modelo', orden.avion.modelo)}
            {renderCampo('Número de serie', orden.avion.numeroSerie)}
            {renderCampo('TSN', orden.avion.TSN)}
            {renderCampo('Venc. Matrícula', orden.avion.vencimientoMatricula)}
            {renderCampo('Venc. Seguro', orden.avion.vencimientoSeguro)}

            {orden.avion.componentes?.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold">Componentes instalados:</p>
                <ul className="list-disc pl-5 text-sm">
                  {orden.avion.componentes.map((c: any) => (
                    <li key={c.id}>
                      {c.tipo ?? '—'} - {c.marca ?? '—'} {c.modelo ?? ''} (N° Serie: {c.numeroSerie ?? '—'})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {orden.componente && (
          <div>
            {renderCampo('Tipo', orden.componente.tipo)}
            {renderCampo('Marca', orden.componente.marca)}
            {renderCampo('Modelo', orden.componente.modelo)}
            {renderCampo('N° Serie', orden.componente.numeroSerie)}

            {orden.componente.propietario && (
              <div className="mt-2">
                <p className="font-semibold">Propietario:</p>
                <p>
                  {orden.componente.propietario.tipoPropietario === 'PERSONA'
                    ? `${orden.componente.propietario.nombre} ${orden.componente.propietario.apellido}`
                    : orden.componente.propietario.nombreEmpresa}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Descripción del trabajo solicitado</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            value={solicitud}
            onChange={(e) => setSolicitud(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Solicitado por</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={solicitadoPor}
            onChange={(e) => setSolicitadoPor(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Archivo de solicitud (PDF o imagen)</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          {orden.solicitudFirma && (
            <p className="mt-2">
              Archivo actual:{' '}
              <a href={orden.solicitudFirma} className="text-blue-600 underline" target="_blank">
                ver
              </a>
            </p>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => router.push(`/ordenes-trabajo/${id}/fase1`)}
            className="text-blue-600 hover:underline"
          >
            ← Fase anterior
          </button>

          <button
            onClick={() => { handleGuardar(true); }}
            className="text-blue-600 hover:underline"
          >
            Fase siguiente →
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleGuardar()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
