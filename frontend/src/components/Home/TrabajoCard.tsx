'use client';

import { useEffect, useMemo, useDeferredValue, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseCard from '../BaseCard';
import BaseHeading from '../BaseHeading';
import { api, fetchJson } from '@/services/api';
import IconButton from '../IconButton';
import { IconVer, IconArchivar, IconDescargar } from '../ui/Icons';

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
    case 'ABIERTA': return 'border-emerald-300 text-emerald-700';
    case 'CERRADA': return 'border-rose-300 text-rose-700';
    case 'CANCELADA': return 'border-slate-300 text-slate-700';
    default: return 'border-slate-300 text-slate-700';
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

export default function TrabajoCard({ soloArchivadas = false }: { soloArchivadas?: boolean }) {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const deferredBusqueda = useDeferredValue(busqueda);
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

  // —— FILTRO (memo + búsqueda diferida) ——
  const ordenesFiltradas = useMemo(() => {
    const texto = norm(deferredBusqueda.trim());
    return ordenes
      .filter((o) => (soloArchivadas ? !!o.archivada : !o.archivada))
      .filter((o) => {
        if (!texto) return true;
        const avion = norm(getDisplayAvionMatricula(o));
        const comp  = norm(getDisplayComponente(o));
        const id    = norm(String(o.id ?? ''));
        return avion.includes(texto) || comp.includes(texto) || id.includes(texto);
      });
  }, [ordenes, soloArchivadas, deferredBusqueda]);

  return (
    <BaseCard>
      <div className="flex items-center justify-between">
        <BaseHeading>{soloArchivadas ? 'Órdenes archivadas' : 'Trabajos realizados'}</BaseHeading>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por matrícula, tipo o ID..."
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {ordenesFiltradas.length === 0 ? (
        <div className="text-slate-500 italic">No se encontraron trabajos.</div>
      ) : (
        <ul className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {ordenesFiltradas.map((orden, idx) => (
            <li
              key={orden?.id ?? `orden-${idx}`}
              className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition"
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
                      return avionMat ? `– Avión ${avionMat}` : '– Avión';
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
                      // abrir en nueva pestaña con pequeño delay por pop-up blockers
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
