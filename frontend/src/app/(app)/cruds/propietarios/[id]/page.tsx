'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AgregarComponenteModal from '@/components/Asignaciones/AsignarComponente';
import EditarComponenteModal from '@/components/Asignaciones/EditarComponente';
import AccionBoton from '@/components/base/Boton';
import { api, apiUrl, fetchJson } from '@/services/api'; 
import VolverAtras from '@/components/Arrow';

type ArchivoRef = {
  id: number;
  storageKey: string;
  mime?: string | null;
  originalName?: string | null;
  sizeAlmacen?: number | null;
}

interface ComponenteExterno {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  numeroParte?: string | null;
  TSN?: number | null;
  TSO?: number | null;
  TBOFecha?: string | null;
  TBOHoras?: number | null;
  archivo8130?: ArchivoRef | string | null; 
}

interface Avion {
  id: number;
  marca: string;
  modelo: string;
  matricula: string;
  archivado?: boolean;
}


interface Propietario {
  id: number;
  tipoPropietario: 'PERSONA' | 'INSTITUCION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
  rut?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

// normaliza nullables a undefined y ArchivoRef a string para el modal
type ComponenteModal = {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  numeroParte?: string;
  TSN?: number;
  TSO?: number;
  TBOHoras?: number;
  TBOFecha?: string;
  archivo8130?: string;
};

// ✅ normaliza string | {storageKey} | null -> string | undefined
function asKey(v?: string | ArchivoRef | null): string | undefined {
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.storageKey;
}

function toComponenteModal(c: ComponenteExterno): ComponenteModal {
  return {
    id: c.id,
    tipo: c.tipo,
    marca: c.marca,
    modelo: c.modelo,
    numeroSerie: c.numeroSerie,
    numeroParte: c.numeroParte ?? undefined,
    TSN: c.TSN ?? undefined,
    TSO: c.TSO ?? undefined,
    TBOHoras: c.TBOHoras ?? undefined,
    TBOFecha: c.TBOFecha ?? undefined,
    archivo8130: asKey(c.archivo8130) ?? undefined,
  };
}

export default function PropietarioDetallePage() {
  const { id } = useParams();
  const [propietario, setPropietario] = useState<Propietario | null>(null);
  const [aviones, setAviones] = useState<Avion[]>([]);
  const [componentes, setComponentes] = useState<ComponenteExterno[]>([]);
  const [loading, setLoading] = useState(true);

  const [mostrarAgregarComponente, setMostrarAgregarComponente] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<ComponenteExterno | null>(null);
  const [mostrarEditarComponente, setMostrarEditarComponente] = useState(false);

const cargarPropietario = async () => {
  try {
    const data = await fetchJson<any>(`/propietarios/${id}`);
    setPropietario(data);
    setAviones(Array.isArray(data.aviones) ? data.aviones : []);
    setComponentes(data.componentesExternos || data.componentes || []);
  } catch (e) {
  console.warn('⚠️ Error al cargar propietario:', e);
} finally {
  setLoading(false);
}
};
// ✅ helper: normaliza a string
function asKey(v?: string | ArchivoRef | null): string | undefined {
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.storageKey;
}

async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
  const q = new URLSearchParams({ key, disposition }).toString();
  return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
}

async function ver8130(input?: string | ArchivoRef | null) {
  const key = asKey(input);
  if (!key) return;
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await obtenerUrlFirmada(key, 'inline');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch {
    win?.close();
  }
}

async function descargar8130(input?: string | ArchivoRef | null) {
  const key = asKey(input);
  if (!key) return;
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await obtenerUrlFirmada(key, 'attachment');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch {
    win?.close();
  }
}


  useEffect(() => {
    if (id) cargarPropietario();
  }, [id]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!propietario) return <div className="p-4">Propietario no encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <VolverAtras texto="Volver a la lista de propietarios" />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles del propietario</h1>

        <div className="space-y-8">
          {/* CARD de presentación */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              {propietario.tipoPropietario === 'INSTITUCION'
                ? propietario.nombreEmpresa || '—'
                : `${propietario.nombre ?? ''} ${propietario.apellido ?? ''}`.trim() || '—'}
            </h2>

            {propietario.tipoPropietario === 'INSTITUCION' && propietario.rut && (
              <p className="text-sm text-slate-600 mb-2">RUT: {propietario.rut}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <p>
                <span className="text-slate-500">Tipo:</span>{' '}
                <span className="text-slate-800 font-medium">
                  {propietario.tipoPropietario === 'INSTITUCION' ? 'Institución' : 'Persona'}
                </span>
              </p>
              {propietario.telefono && (
                <p><span className="text-slate-500">Teléfono:</span> <span className="text-slate-800 font-medium">{propietario.telefono}</span></p>
              )}
              {propietario.email && (
                <p><span className="text-slate-500">Email:</span> <span className="text-slate-800 font-medium">{propietario.email}</span></p>
              )}
              {propietario.direccion && (
                <p className="md:col-span-2"><span className="text-slate-500">Dirección:</span> <span className="text-slate-800 font-medium">{propietario.direccion}</span></p>
              )}
            </div>
          </section>


{/* AVIONES DEL PROPIETARIO */}
<section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold text-slate-900">Aeronaves</h2>
  </div>

  {aviones.filter(a => !a.archivado).length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {aviones.filter(a => !a.archivado).map(a => (
        <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-800">
            <p><span className="text-slate-500">Marca:</span> {a.marca}</p>
            <p><span className="text-slate-500">Modelo:</span> {a.modelo}</p>
            <p><span className="text-slate-500">Matrícula:</span> {a.matricula}</p>
          </div>
          <div className="mt-3">
            <Link
              href={`/cruds/aviones/${a.id}`}
              className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
            >
              ✈️ Ver aeronaves
            </Link>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-slate-600 text-sm mt-2">
      Este propietario no tiene aeronaves vinculadas.
    </p>
  )}
</section>



{/* COMPONENTES EXTERNOS */}
<section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold text-slate-900">Componentes externos</h2>
    <button
      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-4 py-2 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
      onClick={() => setMostrarAgregarComponente(true)}
    >
      Agregar componente
    </button>
  </div>

  {componentes.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {componentes.map((c) => (
        <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-800">
            <p><span className="text-slate-500">Tipo:</span> {c.tipo ?? '—'}</p>
            <p><span className="text-slate-500">Marca:</span> {c.marca}</p>
            <p><span className="text-slate-500">Modelo:</span> {c.modelo}</p>
            <p><span className="text-slate-500">N° Serie:</span> {c.numeroSerie}</p>
            {c.numeroParte && <p><span className="text-slate-500">N° Parte:</span> {c.numeroParte}</p>}
            <p><span className="text-slate-500">TSN:</span> {c.TSN ?? '—'}</p>
            <p><span className="text-slate-500">TSO:</span> {c.TSO ?? '—'}</p>
            <p><span className="text-slate-500">TBO (Horas):</span> {c.TBOHoras ?? '—'}</p>
            <p><span className="text-slate-500">TBO (Fecha):</span> {c.TBOFecha ? c.TBOFecha.slice(0, 10) : '—'}</p>
          </div>

          {/* Acciones 8130 */}
{asKey(c.archivo8130) ? (
  <div className="mt-3 flex gap-3">
    <button
      type="button"
      onClick={() => ver8130(asKey(c.archivo8130))}
      className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      👁️ Ver 8130
    </button>
    <button
      type="button"
      onClick={() => descargar8130(asKey(c.archivo8130))}
      className="rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50"
    >
      Descargar
    </button>
  </div>
) : (
  <p className="mt-3 text-sm text-slate-500">Sin 8130.</p>
)}


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
              label="Archivar"
              color="red"
              onClick={async () => {
                const ok = confirm(`¿Archivar el componente "${c.marca} ${c.modelo}"?`);
                if (!ok) return;
                try {
                  await fetchJson(`/componentes/archivar/${c.id}`, { method: 'PATCH' });
                  await cargarPropietario(); // refresca la vista
                } catch (e: any) {
                  alert(e?.message ?? 'Error');
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-slate-600 text-sm mt-2">No hay componentes asignados.</p>
  )}
</section>

{/* MODALES */}
{mostrarAgregarComponente && (
  <AgregarComponenteModal
    propietarioId={parseInt(id as string)}
    open={true}
    onClose={() => setMostrarAgregarComponente(false)}
    onSaved={cargarPropietario}
  />
)}

{mostrarEditarComponente && componenteSeleccionado && (
  <EditarComponenteModal
    componente={toComponenteModal(componenteSeleccionado)} 
    open={true}
    onClose={() => setMostrarEditarComponente(false)}
    onSaved={cargarPropietario}
  />
)}
        </div>
      </main>
    </div>
  );
}
