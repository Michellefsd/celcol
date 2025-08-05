'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';

export default function Fase2OrdenTrabajoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orden, setOrden] = useState<any>(null);
  const [solicitud, setSolicitud] = useState('');
  const [solicitadoPor, setSolicitadoPor] = useState('');
  const [OTsolicitud, setOTsolicitud] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mostrarSubirSolicitud, setMostrarSubirSolicitud] = useState(false);


useEffect(() => {
  fetch(api(`/ordenes-trabajo/${id}`))
    .then(res => res.json())
    .then(data => {
      if (data.estadoOrden === 'CERRADA') {
        router.replace(`/ordenes-trabajo/${id}/cerrada`);
        return;
      }

      if (data.estadoOrden === 'CANCELADA') {
  router.replace(`/ordenes-trabajo/${id}/cancelada`);
  return;
}
if (data.avion?.ComponenteAvion) {
  data.avion.componentes = data.avion.ComponenteAvion;
}

      setOrden(data);
      setSolicitud(data.solicitud ?? '');
      setSolicitadoPor(data.solicitadoPor ?? '');
      setOTsolicitud(data.OTsolicitud ?? '');
    })
    .catch(err => console.error('Error cargando orden de trabajo:', err));
}, [id]);


  const handleGuardar = async (redirect: boolean = false): Promise<void> => {
    const formData = new FormData();
    formData.append('solicitud', solicitud);
    formData.append('solicitadoPor', solicitadoPor);
    formData.append('OTsolicitud', OTsolicitud);

    if (archivo) {
        formData.append('solicitudFirma', archivo); 
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

      {renderCampo('Número de serie', orden.avion.numeroSerie)}
      {orden.avion.TSN != null && <p><strong>TSN:</strong> {orden.avion.TSN} hs</p>}
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


      {orden.avion.componentes?.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">Componentes instalados:</p>
          <ul className="list-disc pl-5 text-sm">
            {orden.avion.componentes.map((c: any) => (
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

      {renderCampo('N° Serie', orden.componente.numeroSerie)}
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
              : orden.componente.propietario.nombreEmpresa}
          </p>
        </div>
      )}
    </>
  )}
</div>

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
  <label className="block font-medium mb-1">N° de OT previa (otro taller)</label>
  <input
    type="text"
    className="w-full border rounded px-3 py-2"
    value={OTsolicitud}
    onChange={(e) => setOTsolicitud(e.target.value)}
  />
</div>


{/* Subida de archivo de solicitud */}
<div>
  <label className="block font-medium mb-1">Archivo de solicitud (PDF o imagen)</label>
  <button
    onClick={() => setMostrarSubirSolicitud(true)}
    className="px-3 py-1 bg-blue-600 text-white rounded"
  >
    {orden.solicitudFirma ? 'Reemplazar archivo' : 'Subir archivo'}
  </button>

  {orden.solicitudFirma && (
    <div className="mt-2 flex gap-4 items-center text-sm">
      <a
        href={orden.solicitudFirma}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver archivo
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

<SubirArchivo
  open={mostrarSubirSolicitud}
  onClose={() => setMostrarSubirSolicitud(false)}
  url={api(`/ordenes-trabajo/${id}/solicitudFirma`)}
  label="Subir archivo de solicitud"
  nombreCampo="solicitudFirma"
  onUploaded={async () => {
    const res = await fetch(api(`/ordenes-trabajo/${id}`));
    const updated = await res.json();
    setOrden(updated);
  }}
/>


        <div className="flex justify-between mt-6">
        <div></div>

          <button
            onClick={() => { handleGuardar(true); }}
            className="text-blue-600 hover:underline"
          >
            Fase siguiente →
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleGuardar(true)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Guardar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
