'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api, fetchJson } from '@/services/api';
import VolverAtras from '@/components/Arrow';

type ArchivoRef = {
  id: number;
  storageKey: string;
  mime?: string | null;
  originalName?: string | null;
  sizeAlmacen?: number | null;
};

interface Herramienta {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: ArchivoRef | null; // relación Archivo
}

export default function DetalleHerramientaPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Herramienta | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  // Carga del recurso (sin pedir URL firmada acá)
  const cargarHerramienta = async () => {
    if (!id) return;
    const data = await fetchJson<Herramienta>(`/herramientas/${id}`);
    setItem(data);
  };

  useEffect(() => {
    cargarHerramienta().catch(err => console.error('❌ Error:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
    const q = new URLSearchParams({ key, disposition }).toString();
    return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
  }

  // Ver en NUEVA pestaña (evita bloqueos de popup)
  const verCertificado = async () => {
    const key = item?.certificadoCalibracion?.storageKey;
    if (!key) return;

    // 1) abrir la pestaña inmediatamente (gesto del usuario)
    const win = window.open('about:blank', '_blank'); // sin noopener/noreferrer

    try {
      const { url } = await obtenerUrlFirmada(key, 'inline');

      if (!url) {
        win?.close();
        console.error('No llegó URL firmada');
        return;
      }

      if (win) {
        // pequeño delay ayuda a Safari/Pop-up blockers
        setTimeout(() => win.location.replace(url), 60);
      } else {
        // Fallback si el popup fue bloqueado
        window.open(url, '_blank');
      }
    } catch (e) {
      win?.close();
      console.error('❌ No se pudo abrir certificado:', e);
    }
  };

  // Descargar (abre nueva pestaña y fuerza descarga con "attachment")
  const descargarCertificado = async () => {
    const key = item?.certificadoCalibracion?.storageKey;
    if (!key) return;

    const win = window.open('about:blank', '_blank'); // mantener handle

    try {
      const { url } = await obtenerUrlFirmada(key, 'attachment');

      if (!url) {
        win?.close();
        console.error('No llegó URL firmada');
        return;
      }

      if (win) {
        setTimeout(() => win.location.replace(url), 60);
      } else {
        // Fallback si el popup fue bloqueado
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      win?.close();
      console.error('❌ No se pudo descargar certificado:', e);
    }
  };

  if (!item) return <p className="text-gray-500 p-4">Cargando herramienta...</p>;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <VolverAtras texto="Volver a la lista de herramientas" />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles de la herramienta</h1>

        <div className="max-w-3xl space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900">{item.nombre}</h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              {item.tipo && (
                <p>
                  <span className="text-slate-500">Tipo:</span>{' '}
                  <span className="text-slate-800 font-medium">{item.tipo}</span>
                </p>
              )}
              {item.marca && (
                <p>
                  <span className="text-slate-500">Marca:</span>{' '}
                  <span className="text-slate-800 font-medium">{item.marca}</span>
                </p>
              )}
              {item.modelo && (
                <p>
                  <span className="text-slate-500">Modelo:</span>{' '}
                  <span className="text-slate-800 font-medium">{item.modelo}</span>
                </p>
              )}
              {item.numeroSerie && (
                <p>
                  <span className="text-slate-500">N° Serie:</span>{' '}
                  <span className="text-slate-800 font-medium">{item.numeroSerie}</span>
                </p>
              )}
              {item.fechaIngreso && (
                <p>
                  <span className="text-slate-500">Fecha ingreso:</span>{' '}
                  <span className="text-slate-800 font-medium">
                    {new Date(item.fechaIngreso).toLocaleDateString()}
                  </span>
                </p>
              )}
              {item.fechaVencimiento && (
                <p>
                  <span className="text-slate-500">Vencimiento:</span>{' '}
                  <span className="text-slate-800 font-medium">
                    {new Date(item.fechaVencimiento).toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>

            {/* Certificado */}
            <div className="mt-5">
              {item.certificadoCalibracion ? (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Ver en nueva pestaña */}
                  <button
                    type="button"
                    onClick={verCertificado}
                    className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                  >
                    👁️ Ver certificado
                  </button>

                  {/* Descargar */}
                  <button
                    type="button"
                    onClick={descargarCertificado}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                  >
                    Descargar
                  </button>

                  {/* Reemplazar */}
                  <button
                    onClick={() => setMostrarSubirCertificado(true)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                  >
                    Reemplazar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarSubirCertificado(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
                >
                  Subir certificado
                </button>
              )}
            </div>
          </section>

          <SubirArchivo
            open={mostrarSubirCertificado}
            onClose={() => setMostrarSubirCertificado(false)}
            url={api(`/herramientas/${item.id}/certificadoCalibracion`)} // POST absoluto al backend
            label="Subir certificado de calibración"
            nombreCampo="certificadoCalibracion"
            onUploaded={async () => {
              await cargarHerramienta();
              setMostrarSubirCertificado(false);
            }}
          />
        </div>
      </main>
    </div>
  );
}
