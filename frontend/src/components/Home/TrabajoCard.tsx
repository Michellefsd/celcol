'use client';

import { useEffect, useMemo, useDeferredValue, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseCard from '../BaseCard';
import BaseHeading from '../BaseHeading';
import { api, fetchJson } from '@/services/api';
import IconButton from '../IconButton';
import { IconVer, IconArchivar, IconDescargar } from '../ui/Icons';
import { entityLabel } from '@/lib/labels';


type SnapshotAvion = {
  matricula?: string | null;
  marca?: string | null;
  modelo?: string | null;
};

type SnapshotComponente = {
  tipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
};

type OrdenTrabajo = {
  id: number;
  fechaApertura: string | null;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  archivada?: boolean;
  avion?: { matricula: string } | null;
  componente?: { tipo: string; marca: string; modelo: string } | null;
  datosAvionSnapshot?: SnapshotAvion | null;
  datosComponenteSnapshot?: SnapshotComponente | null;
};

function badgeClasses(estado: OrdenTrabajo['estadoOrden']) {
  switch (estado) {
    case 'ABIERTA': return 'border-emerald-300 text-emerald-700 bg-emerald-50 shadow-sm';
    case 'CERRADA': return 'border-rose-300 text-rose-700 bg-rose-50 shadow-sm';
    case 'CANCELADA': return 'border-slate-300 text-slate-700 bg-slate-50 shadow-sm';
    default: return 'border-slate-300 text-slate-700 bg-slate-50 shadow-sm';
  }
}

function isAbortError(err: any) {
  return err?.name === 'AbortError' || err?.code === 'ABORT_ERR';
}

// —— helpers “hoisted” (sin TDZ) ——
function isFinal(estado: OrdenTrabajo['estadoOrden']) {
  return estado === 'CERRADA' || estado === 'CANCELADA';
}

function esDeComponente(o: OrdenTrabajo) {
  return isFinal(o.estadoOrden) ? !!o.datosComponenteSnapshot : !!o.componente;
}

function esDeAvion(o: OrdenTrabajo) {
  return isFinal(o.estadoOrden) ? !!o.datosAvionSnapshot : !!o.avion;
}

// normaliza texto (lowercase + sin acentos)
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function getDisplayAvionMatricula(o: OrdenTrabajo) {
  const mat = isFinal(o.estadoOrden)
    ? (o.datosAvionSnapshot?.matricula ?? '')
    : (o.avion?.matricula ?? '');
  return (mat || '').trim();
}

function getDisplayComponente(o: OrdenTrabajo) {
  const src = isFinal(o.estadoOrden) ? o.datosComponenteSnapshot : o.componente;
  if (!src) return '';
  const tipo = (src as any).tipo ?? '';
  const marca = (src as any).marca ?? '';
  const modelo = (src as any).modelo ?? '';
  const numeroSerie = (src as any).numeroSerie ?? (src as any).numeroParte ?? '';
  const base = [tipo, (marca || modelo) ? `(${[marca, modelo].filter(Boolean).join(' ')})` : '']
    .filter(Boolean)
    .join(' ');
  return [base, numeroSerie ? `#${numeroSerie}` : ''].filter(Boolean).join(' ').trim();
}

type FiltroEstado = 'TODAS' | 'ABIERTA' | 'CERRADA' | 'CANCELADA';

export default function TrabajoCard({ soloArchivadas = false }: { soloArchivadas?: boolean }) {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const deferredBusqueda = useDeferredValue(busqueda);
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('TODAS');
  const router = useRouter();

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const json = await fetchJson<any[]>('/ordenes-trabajo', { signal: ac.signal });
        const arr = Array.isArray(json)
          ? json
          : Array.isArray((json as any)?.data)
          ? (json as any).data
          : json
          ? [json]
          : [];
        if (!ac.signal.aborted) setOrdenes(arr as OrdenTrabajo[]);
      } catch (err: any) {
        if (isAbortError(err)) return;
        if (err?.status === 401) { router.push('/login'); return; }
        console.error('Error al cargar órdenes:', err);
      }
    })();
    return () => ac.abort();
  }, [router]);

  function formatearFecha(fecha: string | null) {
    if (!fecha) return '—';
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-UY');
  }

  // —— contadores por estado (para tooltip y posible UI futura) ——
  const counts = useMemo(() => {
    const lista = ordenes.filter(o => (soloArchivadas ? !!o.archivada : !o.archivada));
    return {
      ABIERTA: lista.filter(o => o.estadoOrden === 'ABIERTA').length,
      CERRADA: lista.filter(o => o.estadoOrden === 'CERRADA').length,
      CANCELADA: lista.filter(o => o.estadoOrden === 'CANCELADA').length,
      TOTAL: lista.length,
    };
  }, [ordenes, soloArchivadas]);

  // —— FILTRO (memo + búsqueda diferida + estado) ——
  const ordenesFiltradas = useMemo(() => {
    const texto = norm(deferredBusqueda.trim());
    return ordenes
      .filter((o) => (soloArchivadas ? !!o.archivada : !o.archivada))
      .filter((o) => (estadoFiltro === 'TODAS' ? true : o.estadoOrden === estadoFiltro))
      .filter((o) => {
        if (!texto) return true;
        const avion = norm(getDisplayAvionMatricula(o));
        const comp  = norm(getDisplayComponente(o));
        const id    = norm(String(o.id ?? ''));
        return avion.includes(texto) || comp.includes(texto) || id.includes(texto);
      });
  }, [ordenes, soloArchivadas, deferredBusqueda, estadoFiltro]);

  // —— UI helpers: botón redondo de filtro
  function CircleFilter({
    color,
    active,
    onClick,
    title,
  }: {
    color: 'emerald' | 'rose' | 'slate';
    active: boolean;
    onClick: () => void;
    title: string;
  }) {
    const base =
      'h-4 w-4 rounded-full border transition ring-offset-2 cursor-pointer';
    const map: Record<typeof color, string> = {
      emerald: active
        ? 'bg-emerald-500 border-emerald-600 ring-2 ring-emerald-400'
        : 'bg-emerald-400/70 border-emerald-500 hover:ring-2 hover:ring-emerald-300',
      rose: active
        ? 'bg-rose-500 border-rose-600 ring-2 ring-rose-400'
        : 'bg-rose-400/70 border-rose-500 hover:ring-2 hover:ring-rose-300',
      slate: active
        ? 'bg-slate-400 border-slate-500 ring-2 ring-slate-300'
        : 'bg-slate-300 border-slate-400 hover:ring-2 hover:ring-slate-300',
    };
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        className={`${base} ${map[color]}`}
      />
    );
  }

  return (
    <BaseCard>
      <div className="flex items-center justify-between">
        <BaseHeading>{soloArchivadas ? 'Órdenes archivadas' : 'Trabajos realizados'}</BaseHeading>

        {/* ——— filtros por estado: ABIERTA (verde) / CERRADA (rojo) / CANCELADA (gris) ——— */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CircleFilter
              color="emerald"
              active={estadoFiltro === 'ABIERTA'}
              title={`ABIERTAS (${counts.ABIERTA})`}
              onClick={() =>
                setEstadoFiltro((prev) => (prev === 'ABIERTA' ? 'TODAS' : 'ABIERTA'))
              }
            />
            <CircleFilter
              color="rose"
              active={estadoFiltro === 'CERRADA'}
              title={`CERRADAS (${counts.CERRADA})`}
              onClick={() =>
                setEstadoFiltro((prev) => (prev === 'CERRADA' ? 'TODAS' : 'CERRADA'))
              }
            />
            <CircleFilter
              color="slate"
              active={estadoFiltro === 'CANCELADA'}
              title={`CANCELADAS (${counts.CANCELADA})`}
              onClick={() =>
                setEstadoFiltro((prev) => (prev === 'CANCELADA' ? 'TODAS' : 'CANCELADA'))
              }
            />
          </div>

          {/* indicador de filtro activo (opcional) */}
          {estadoFiltro !== 'TODAS' && (
            <span className="text-xs text-slate-500">
              Filtrando: <strong>{estadoFiltro}</strong> · {ordenesFiltradas.length}/{counts.TOTAL}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 mt-3 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-slate-400 text-sm">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Buscar por matrícula, tipo o ID..."
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2 text-slate-800 placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
                     hover:border-slate-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {ordenesFiltradas.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-slate-500 italic">No se encontraron trabajos.</div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 max-h-96 overflow-y-auto space-y-2">
          {ordenesFiltradas.map((orden, idx) => (
            <li
              key={orden?.id ?? `orden-${idx}`}
              className="py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 px-3 rounded-xl transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs mr-2 ${badgeClasses(orden.estadoOrden)}`}
                    title={orden.estadoOrden}
                  >
                    {orden.estadoOrden}
                  </span>
                  #{orden.id}{' '}
                  {(() => {
                    if (esDeAvion(orden)) {
                      const avionMat = getDisplayAvionMatricula(orden);
                      return avionMat
                        ? `– ${entityLabel('avion')} ${avionMat}`
                        : `– ${entityLabel('avion')}`;
                    }
                    if (esDeComponente(orden)) {
                      const compTxt = getDisplayComponente(orden);
                      return compTxt ? `– Componente ${compTxt}` : '– Componente';
                    }
                    return '';
                  })()}
                </p>

                <p className="text-xs text-slate-500">{formatearFecha(orden.fechaApertura)}</p>
              </div>

              <div className="flex items-center gap-2">
                {!soloArchivadas && ['CERRADA', 'CANCELADA'].includes(orden.estadoOrden) && (
                  <IconButton
                    icon={IconArchivar}
                    title="Archivar orden"
                    className="text-amber-600 hover:text-amber-800"
                    onClick={async () => {
                      const confirmar = confirm(`¿Querés archivar la orden #${orden.id}?`);
                      if (!confirmar) return;
                      try {
                        await fetchJson(`/ordenes-trabajo/${orden.id}/archivar`, { method: 'PUT' });
                        setOrdenes(prev => prev.map(o => (o.id === orden.id ? { ...o, archivada: true } : o)));
                        alert(`Orden #${orden.id} archivada con éxito.`);
                      } catch (err: any) {
                        if (isAbortError(err)) return;
                        if (err?.status === 401) { router.push('/login'); return; }
                        console.error(err);
                        alert('No se pudo archivar la orden.');
                      }
                    }}
                  />
                )}

                {['CERRADA', 'CANCELADA'].includes(orden.estadoOrden) && (
                  <IconButton
                    icon={IconDescargar}
                    title="Descargar PDF"
                    className="text-slate-700 hover:text-slate-900"
                    onClick={() => {
                      const url = api(`/ordenes-trabajo/${orden.id}/pdf`);
                      const win = window.open('about:blank', '_blank');
                      if (win) setTimeout(() => (win.location.href = url), 60);
                      else window.open(url, '_blank');
                    }}
                  />
                )}

                <IconButton
                  icon={IconVer}
                  title="Ver orden"
                  className="text-cyan-600 hover:text-cyan-800"
                  onClick={() => {
                    const base =
                      orden.estadoOrden === 'ABIERTA'
                        ? `/ordenes-trabajo/${orden.id}/fase3`
                        : orden.estadoOrden === 'CERRADA'
                        ? `/ordenes-trabajo/${orden.id}/cerrada`
                        : `/ordenes-trabajo/${orden.id}/cancelada`;

                    const href = (soloArchivadas || orden.archivada) ? `${base}?includeArchived=1` : base;
                    router.push(href);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </BaseCard>
  );
}
