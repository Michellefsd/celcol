/*'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api } from '@/services/api'; 
import VolverAtras from '@/components/Arrow';

interface Herramienta {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
}

export default function DetalleHerramientaPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Herramienta | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  useEffect(() => {
    if (!id) return;

    const url = api(`/herramientas/${id}`);
    console.log('🔧 Cargando herramienta desde:', url);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status} al obtener herramienta`);
        return res.json();
      })
      .then((data) => {
        setItem({ ...data, certificadoCalibracion: data.certificadoCalibracion });
      })
      .catch((err) => console.error('❌ Error al cargar la herramienta:', err));
  }, [id]);

  if (!item) return <p className="text-gray-500">Cargando herramienta...</p>;

  const esVisualizableEnNavegador = (url: string): boolean => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
  };


return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
      {/* Header *//*}






      <div className="flex items-center justify-between mb-4">
        <VolverAtras texto="Volver a la lista de herramientas" />
      </div>

      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles de la herramienta</h1>

      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900">{item.nombre}</h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {item.tipo && (
              <p><span className="text-slate-500">Tipo:</span> <span className="text-slate-800 font-medium">{item.tipo}</span></p>
            )}
            {item.marca && (
              <p><span className="text-slate-500">Marca:</span> <span className="text-slate-800 font-medium">{item.marca}</span></p>
            )}
            {item.modelo && (
              <p><span className="text-slate-500">Modelo:</span> <span className="text-slate-800 font-medium">{item.modelo}</span></p>
            )}
            {item.numeroSerie && (
              <p><span className="text-slate-500">N° Serie:</span> <span className="text-slate-800 font-medium">{item.numeroSerie}</span></p>
            )}
            {item.fechaIngreso && (
              <p><span className="text-slate-500">Fecha ingreso:</span> <span className="text-slate-800 font-medium">{new Date(item.fechaIngreso).toLocaleDateString()}</span></p>
            )}
            {item.fechaVencimiento && (
              <p><span className="text-slate-500">Vencimiento:</span> <span className="text-slate-800 font-medium">{new Date(item.fechaVencimiento).toLocaleDateString()}</span></p>
            )}
          </div>

          {/* Certificado *//*}





          <div className="mt-5">
            {item.certificadoCalibracion ? (
              <div className="flex flex-wrap items-center gap-3">
                {esVisualizableEnNavegador(item.certificadoCalibracion) && (
                  <a
                    href={api(`/${item.certificadoCalibracion}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                  >
                    👁️ Ver certificado
                  </a>
                )}

                <a
                  href={api(`/${item.certificadoCalibracion}`)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                >
                  Descargar
                </a>

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
          url={api(`/herramientas/${item.id}/certificadoCalibracion`)}
          label="Subir certificado de calibración"
          nombreCampo="certificadoCalibracion"
          onUploaded={() => {
            fetch(api(`/herramientas/${item.id}`))
              .then((res) => {
                if (!res.ok) throw new Error('No se pudo recargar herramienta');
                return res.json();
              })
              .then((data) => setItem(data))
              .catch((err) => console.error('Error al recargar:', err));
          }}
        />
      </div>
    </main>
  </div>
);
  }
*/





'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api, apiUrl, fetchJson } from '@/services/api';
import VolverAtras from '@/components/Arrow';

interface Herramienta {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
}

export default function DetalleHerramientaPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Herramienta | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  // URL absoluta del certificado (aunque item sea null, el hook se ejecuta siempre)
  const certificadoUrl = useMemo(() => {
    if (!item?.certificadoCalibracion) return '';
    const raw = item.certificadoCalibracion;
    return raw.startsWith('http') ? raw : apiUrl(`/${raw.replace(/^\/+/, '')}`);
  }, [item?.certificadoCalibracion]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchJson<Herramienta>(`/herramientas/${id}`); // cookies incluidas ⇒ sin 401
        setItem(data);
      } catch (err) {
        console.error('❌ Error al cargar la herramienta:', err);
      }
    })();
  }, [id]);

  const esVisualizableEnNavegador = (url: string): boolean => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
  };

  if (!item) return <p className="text-gray-500">Cargando herramienta...</p>;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <VolverAtras texto="Volver a la lista de herramientas" />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles de la herramienta</h1>

        <div className="max-w-3xl space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900">{item.nombre}</h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              {item.tipo && (
                <p><span className="text-slate-500">Tipo:</span> <span className="text-slate-800 font-medium">{item.tipo}</span></p>
              )}
              {item.marca && (
                <p><span className="text-slate-500">Marca:</span> <span className="text-slate-800 font-medium">{item.marca}</span></p>
              )}
              {item.modelo && (
                <p><span className="text-slate-500">Modelo:</span> <span className="text-slate-800 font-medium">{item.modelo}</span></p>
              )}
              {item.numeroSerie && (
                <p><span className="text-slate-500">N° Serie:</span> <span className="text-slate-800 font-medium">{item.numeroSerie}</span></p>
              )}
              {item.fechaIngreso && (
                <p><span className="text-slate-500">Fecha ingreso:</span> <span className="text-slate-800 font-medium">{new Date(item.fechaIngreso).toLocaleDateString()}</span></p>
              )}
              {item.fechaVencimiento && (
                <p><span className="text-slate-500">Vencimiento:</span> <span className="text-slate-800 font-medium">{new Date(item.fechaVencimiento).toLocaleDateString()}</span></p>
              )}
            </div>

            {/* Certificado */}
            <div className="mt-5">
              {item.certificadoCalibracion ? (
                <div className="flex flex-wrap items-center gap-3">
                  {certificadoUrl && esVisualizableEnNavegador(certificadoUrl) && (
                    <a
                      href={certificadoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    >
                      👁️ Ver certificado
                    </a>
                  )}

                  {certificadoUrl && (
                    <a
                      href={certificadoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                    >
                      Descargar
                    </a>
                  )}

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
            url={api(`/herramientas/${item.id}/certificadoCalibracion`)}
            label="Subir certificado de calibración"
            nombreCampo="certificadoCalibracion"
            onUploaded={async () => {
              try {
                const data = await fetchJson<Herramienta>(`/herramientas/${item.id}`); // recarga con cookies
                setItem(data);
              } catch (err) {
                console.error('Error al recargar herramienta:', err);
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
