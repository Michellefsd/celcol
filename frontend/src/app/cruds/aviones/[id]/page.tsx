'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AsignarAvionComponente from '@/components/Asignaciones/AsignarAvionComponentes';
import EditarAvionComponente from '@/components/Asignaciones/EditarAvionComponente';
import AccionBoton from '@/components/base/Boton';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api } from '@/services/api'; 
import VolverAtras from '@/components/Arrow';

interface Propietario {
  id: number;
  tipo: 'PERSONA' | 'ORGANIZACION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
}

interface ComponenteAvion {
  id: number;
  tipo: 'MOTOR' | 'HELICE' | 'INSTRUMENTO' | string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  estado: 'ACTIVO' | 'MANTENIMIENTO' | 'DESINSTALADO';
  TSN?: number | null;
  TSO?: number | null;
  TBOFecha?: string | null;
  TBOHoras?: number | null;
}

interface Avion {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie?: string | null; 
  matricula: string;
  TSN: number | null;

  vencimientoMatricula?: string | null; 
  vencimientoSeguro?: string | null;    
  certificadoMatricula?: string | null; 
  propietarios: { propietario: Propietario }[];
  componentes: ComponenteAvion[];
}

export default function AvionDetallePage() {
  const { id } = useParams();
  const [avion, setAvion] = useState<Avion | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAgregarComponente, setMostrarAgregarComponente] = useState(false);
  const [mostrarEditarComponente, setMostrarEditarComponente] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<ComponenteAvion | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  const cargarAvion = async () => {
    const res = await fetch(api(`/aviones/${id}`));
    const data = await res.json();
    setAvion(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) cargarAvion();
  }, [id]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!avion) return <div className="p-4">Avión no encontrado</div>;

  const esVisualizableEnNavegador = (url: string): boolean => {
  const extension = url.split('.').pop()?.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
};


return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <VolverAtras texto=" " />
      </div>

      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles del avión</h1>

      <div className="space-y-8">
        {/* CARD de presentación */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{avion.matricula}</h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <p><span className="text-slate-500">Marca:</span> <span className="text-slate-800 font-medium">{avion.marca}</span></p>
                <p><span className="text-slate-500">Modelo:</span> <span className="text-slate-800 font-medium">{avion.modelo}</span></p>
                {avion.numeroSerie && (
                  <p><span className="text-slate-500">N° Serie:</span> <span className="text-slate-800 font-medium">{avion.numeroSerie}</span></p>
                )}
                {avion.TSN != null && (
                  <p><span className="text-slate-500">TSN:</span> <span className="text-slate-800 font-medium">{avion.TSN}</span></p>
                )}
                {avion.vencimientoMatricula && (
                  <p><span className="text-slate-500">Vto. Matrícula:</span> <span className="text-slate-800 font-medium">{avion.vencimientoMatricula.slice(0,10)}</span></p>
                )}
                {avion.vencimientoSeguro && (
                  <p><span className="text-slate-500">Vto. Seguro:</span> <span className="text-slate-800 font-medium">{avion.vencimientoSeguro.slice(0,10)}</span></p>
                )}
              </div>
            </div>

            {/* Certificado */}
            <div className="mt-1">
              {avion.certificadoMatricula ? (
                <div className="flex flex-wrap items-center gap-3">
                  {esVisualizableEnNavegador(avion.certificadoMatricula) && (
                    <a
                      href={api(`/${avion.certificadoMatricula}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    >
                      👁️ Ver certificado
                    </a>
                  )}

                  <a
                    href={api(`/${avion.certificadoMatricula}`)}
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
          </div>
        </section>

        {/* PROPIETARIOS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Propietarios</h2>
          {avion.propietarios?.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {avion.propietarios.map(({ propietario }) => {
                const nombre =
                  propietario.tipo === 'ORGANIZACION'
                    ? propietario.nombreEmpresa
                    : `${propietario.nombre} ${propietario.apellido}`;
                return (
                  <li
                    key={propietario.id}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700"
                  >
                    {nombre}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-slate-600 text-sm">No hay propietarios asignados.</p>
          )}
        </section>

        {/* COMPONENTES DEL AVIÓN */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Componentes del avión</h2>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-4 py-2 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
              onClick={() => setMostrarAgregarComponente(true)}
            >
              Agregar componente
            </button>
          </div>

          {avion.componentes?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {avion.componentes.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-800">
                    <p><span className="text-slate-500">Tipo:</span> {c.tipo ?? '—'}</p>
                    <p><span className="text-slate-500">Estado:</span> {c.estado}</p>
                    <p><span className="text-slate-500">Marca:</span> {c.marca}</p>
                    <p><span className="text-slate-500">Modelo:</span> {c.modelo}</p>
                    <p><span className="text-slate-500">N° Serie:</span> {c.numeroSerie}</p>
                    <p><span className="text-slate-500">TSN:</span> {c.TSN ?? '—'}</p>
                    <p><span className="text-slate-500">TSO:</span> {c.TSO ?? '—'}</p>
                    <p><span className="text-slate-500">TBO (Horas):</span> {c.TBOHoras ?? '—'}</p>
                    <p><span className="text-slate-500">TBO (Fecha):</span> {c.TBOFecha ? c.TBOFecha.slice(0,10) : '—'}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <AccionBoton
                      label="Editar"
                      color="blue"
                      onClick={() => {
                        setComponenteSeleccionado(c);
                        setMostrarEditarComponente(true);
                      }}
                    />
                    <AccionBoton
                      label="Eliminar"
                      color="red"
                      onClick={async () => {
                        const confirmar = confirm(`¿Eliminar el componente "${c.tipo} ${c.marca} ${c.modelo}"?`);
                        if (!confirmar) return;
                        await fetch(api(`/componentes-avion/${c.id}`), { method: 'DELETE' });
                        cargarAvion();
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">No hay componentes asignados.</p>
          )}
        </section>

        {/* MODALES */}
        {mostrarAgregarComponente && (
          <AsignarAvionComponente
            avionId={parseInt(id as string)}
            onClose={() => setMostrarAgregarComponente(false)}
            onSaved={cargarAvion}
          />
        )}

        {mostrarEditarComponente && componenteSeleccionado && (
          <EditarAvionComponente
            componente={componenteSeleccionado}
            onClose={() => setMostrarEditarComponente(false)}
            onSaved={cargarAvion}
          />
        )}

        <SubirArchivo
          open={mostrarSubirCertificado}
          onClose={() => setMostrarSubirCertificado(false)}
          url={api(`/aviones/${avion.id}/certificadoMatricula`)}
          label="Subir certificado de matrícula"
          nombreCampo="certificadoMatricula"
          onUploaded={cargarAvion}
        />
      </div>
    </main>
  </div>
);

  }

