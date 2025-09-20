'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, fetchJson, apiFetch} from '@/services/api';
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

 // --- helpers concretos a tu modelo
function ownerFullName(p?: { nombre?: string; apellido?: string } | null) {
  if (!p) return '';
  return [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
}

// devuelve el propietario PERSONA sugerido:
// 1) si hay componente con propietario -> ese
// 2) si no, el primer propietario del avión (propietarios: { propietario }[])
function pickOwnerFromOrden(orden: any): any | null {
  if (orden?.componente?.propietario) return orden.componente.propietario;

  const arr = Array.isArray(orden?.avion?.propietarios) ? orden.avion.propietarios : [];
  if (arr.length === 0) return null;

  // cada item es { propietario: Propietario }
  const first = arr[0]?.propietario ?? null;
  return first ?? null;
}

// — Sugerencia calculada (solo PERSONA: nombre y apellido)
const sugerenciaSolicitadoPor = ownerFullName(pickOwnerFromOrden(orden)) || '';
console.debug('sugerenciaSolicitadoPor (placeholder):', sugerenciaSolicitadoPor);

// Completa con Tab si el campo está vacío
function handleKeyDownSolicitadoPor(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Tab' && !solicitadoPor && sugerenciaSolicitadoPor) {
    setSolicitadoPor(sugerenciaSolicitadoPor);
    console.debug('▶ sugerencia aplicada por Tab:', sugerenciaSolicitadoPor);
  }
}
useEffect(() => {
  if (!solicitadoPor && orden) {
    const p = pickOwnerFromOrden(orden);
    const name = ownerFullName(p);
    if (name) setSolicitadoPor(name);
    console.debug('▶ owner detectado:', p);
  }
}, [orden]); // recalcula cuando llega la OT


useEffect(() => {
  fetchJson<any>(`/ordenes-trabajo/${id}`)
    .then((data) => {
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
    .catch((err) => console.error('Error cargando orden de trabajo:', err));
}, [id]);


  const handleGuardar = async (redirect: boolean = false): Promise<void> => {
    const formData = new FormData();
    formData.append('solicitud', solicitud);
    formData.append('solicitadoPor', solicitadoPor);
    formData.append('OTsolicitud', OTsolicitud);

    if (archivo) {
        formData.append('solicitudFirma', archivo); 
    }

try {
      const updated = await apiFetch<any>(`/ordenes-trabajo/${id}/fase2`, {
        method: 'PUT',
        body: formData, // FormData → el helper gestiona cookies + refresh
      });
      if (redirect) {
        router.push(`/ordenes-trabajo/${id}/fase3`);
      } else {
        alert('Datos guardados correctamente');
        setOrden(updated);
      }
    } catch (e:any) {
      alert(e?.body?.error || e?.message || 'Error al guardar');
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

// helpers iguales a herramientas
async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
  const q = new URLSearchParams({ key, disposition }).toString();
  return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
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
      <h1 className="text-2xl font-semibold text-slate-900">
        Fase 2: Detalles de la orden #{orden.id}
      </h1>

      {/* Resumen del objeto (avión o componente) */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
        <div className="space-y-2 text-sm">
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
                    href={api(orden.avion.certificadoMatricula)}
                    className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    👁️ Ver certificado de matrícula
                  </a>
                  <a
                    href={api(orden.avion.certificadoMatricula)}
                    download
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    Descargar
                  </a>
                </div>
              )}

              {/* Soporta .componentes o .ComponenteAvion */}
              {(() => {
                const comps =
                  (Array.isArray(orden.avion.componentes) && orden.avion.componentes) ||
                  (Array.isArray(orden.avion.ComponenteAvion) && orden.avion.ComponenteAvion) ||
                  [];
                return comps.length > 0 ? (
                  <div className="mt-3">
                    <p className="font-semibold text-slate-800">Componentes instalados:</p>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {comps.map((c: any) => (
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
                ) : null;
              })()}
            </>
          )}

          {orden.componente && (
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
                      : orden.componente.propietario.nombreEmpresa}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Formulario */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descripción del trabajo solicitado <span className="text-rose-600">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            rows={4}
            value={solicitud}
            onChange={(e) => setSolicitud(e.target.value)}
          />
        </div>
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Solicitado por
  </label>
  <div className="flex gap-2">
    <input
      type="text"
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
      value={solicitadoPor}
      placeholder={sugerenciaSolicitadoPor || 'Ingresá nombre o empresa'}
      onChange={(e) => setSolicitadoPor(e.target.value)}
      onKeyDown={handleKeyDownSolicitadoPor}
    />
  </div>
</div>


        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">N.º de OT previa (otro taller)</label>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            value={OTsolicitud}
            onChange={(e) => setOTsolicitud(e.target.value)}
          />
        </div>

        {/* Archivo de solicitud */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Archivo de solicitud (PDF o imagen)</label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMostrarSubirSolicitud(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
            >
              {orden.solicitudFirma ? 'Reemplazar archivo' : 'Subir archivo'}
            </button>

           {orden.solicitudFirma?.storageKey && (
  <div className="flex flex-wrap items-center gap-3">
    <button
      type="button"
      onClick={() => verSolicitud(orden.solicitudFirma.storageKey)}
      className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      👁️ Ver archivo
    </button>

    <button
      type="button"
      onClick={() => descargarSolicitud(orden.solicitudFirma.storageKey)}
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      Descargar
    </button>
  </div>
)}


          </div>
<SubirArchivo
  open={mostrarSubirSolicitud}
  onClose={() => setMostrarSubirSolicitud(false)}
  url={`/ordenes-trabajo/${id}/solicitudFirma`}  
  label="Subir archivo de solicitud"
  nombreCampo="solicitudFirma"                     
  onUploaded={async () => {
    const updated = await fetchJson<any>(`/ordenes-trabajo/${id}`);
    setOrden(updated);
  }}
/>
</div>
        {/* Navegación y acciones */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Fase anterior: apunté a /ordenes-trabajo/nueva. Si tenés una Fase 1 por id, cambiá la ruta aquí. */}
     <div></div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => handleGuardar(false)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
                         font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4]
                         hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
            >
              Guardar
            </button>

            <button
              onClick={() => handleGuardar(true)}
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
