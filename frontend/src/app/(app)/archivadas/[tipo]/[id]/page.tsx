'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BaseCard from '@/components/BaseCard';
import BaseHeading from '@/components/BaseHeading';
import { fetchJson } from '@/services/api';

// Tipos admitidos en la URL: /archivados/[tipo]/[id]
// Queda genérico y reutilizable para: empleados, herramientas, stock,
// propietarios, componentes (externos) y aviones archivados.

type Tipo =
  | 'empleados'
  | 'herramientas'
  | 'stock'
  | 'propietarios'
  | 'componentes'
  | 'aviones';

const TIPOS: readonly Tipo[] = [
  'empleados',
  'herramientas',
  'stock',
  'propietarios',
  'componentes',
  'aviones',
] as const;

function isValidTipo(x: string): x is Tipo {
  return (TIPOS as readonly string[]).includes(x);
}

const singularByTipo: Record<Tipo, string> = {
  empleados: 'Empleado',
  herramientas: 'Herramienta',
  stock: 'Producto de stock',
  propietarios: 'Propietario',
  componentes: 'Componente externo',
  aviones: 'Avión',
};

// Endpoints para traer el detalle (incluyendo archivados)
// Ajusta las rutas si en tu backend varían los prefijos.
const endpointByTipo = {
  empleados:    (id: string) => `/personal/${id}?includeArchived=1`,
  herramientas: (id: string) => `/herramientas/${id}?includeArchived=1`,
  stock:        (id: string) => `/stock/${id}?includeArchived=1`,
  propietarios: (id: string) => `/propietarios/${id}?includeArchived=1`,
  componentes:  (id: string) => `/componentes/${id}?includeArchived=1`,
  aviones:      (id: string) => `/aviones/${id}?includeArchived=1`,
} as const;


const niceLabel = (k: string) =>
  k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ')
    .trim();

const isLikelyDate = (v: unknown) =>
  typeof v === 'string' && /^(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T)/.test(v);

const isFileField = (k: string) => /archivo|pdf|url|certificado/i.test(k);

function Value({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">—</span>;
  }
  if (typeof value === 'boolean') return <span>{value ? 'Sí' : 'No'}</span>;
  if (typeof value === 'number') return <span>{value}</span>;
  if (typeof value === 'string') {
    if (/^https?:\/\//.test(value)) {
      const label = decodeURIComponent(value.split('/').pop() || 'Abrir');
      return (
        <a href={value} target="_blank" rel="noreferrer" className="underline">
          {label}
        </a>
      );
    }
    if (isLikelyDate(value)) {
      const d = new Date(value);
      return <span>{isNaN(d.getTime()) ? value : d.toLocaleString()}</span>;
    }
    return <span>{value}</span>;
  }
  return (
    <pre className="text-xs bg-slate-50 p-2 rounded-md overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function KeyValueGrid({ obj }: { obj: Record<string, any> }) {
  if (!obj) return null;
  const entries = Object.entries(obj).filter(([k, v]) => {
    if (['id', 'createdAt', 'updatedAt', 'archivado'].includes(k)) return false;
    if (Array.isArray(v)) return false; // las colecciones se rinden aparte
    if (v === null || v === undefined || v === '') return false;
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-slate-200 p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            {niceLabel(k)}
          </dt>
          <dd className="mt-1 text-sm">
            {isFileField(k) && typeof v === 'string' ? (
              <a href={v} target="_blank" rel="noreferrer" className="underline">
                Ver archivo
              </a>
            ) : (
              <Value value={v} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ArraySection({ name, rows }: { name: string; rows: any[] }) {
  if (!rows?.length) return null;
  const headers = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-700">{name}</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">
                  {niceLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 align-top">
                    <Value value={row?.[h]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ArchivadoDetallePage() {
  const params = useParams<{ tipo: string; id: string }>();
  const router = useRouter();

  const tipoParam = (params?.tipo || '').toString();
  const id = (params?.id || '').toString();

  const valid = isValidTipo(tipoParam);
  const tipo = valid ? (tipoParam as Tipo) : undefined;

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!tipo) {
        setError('Tipo inválido');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = endpointByTipo[tipo](id);
        const data = await fetchJson<any>(url);
        if (!cancelled) setItem(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'No se pudo cargar el detalle.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [tipo, id]);

  const arraySections = useMemo(() => {
    if (!item) return [] as { name: string; rows: any[] }[];
    const sections: { name: string; rows: any[] }[] = [];
    Object.entries(item).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length) {
        sections.push({ name: niceLabel(k), rows: v });
      }
    });
    return sections;
  }, [item]);

  const title = tipo ? `${singularByTipo[tipo]} #${id}` : 'Archivado';

  return (
    <BaseCard>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Volver
          </button>
          <span className="text-xs rounded-full bg-slate-900 text-white px-2 py-0.5">
            Archivado
          </span>
        </div>
        <Link href="/archivadas" className="text-sm underline">
          Ver todos los archivados
        </Link>
      </div>

      <BaseHeading>{title}</BaseHeading>

      {loading && <p className="mt-4 text-sm">Cargando…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && item && (
        <div className="mt-5 space-y-8">
          {/* Campos simples */}
          <KeyValueGrid obj={item} />

          {/* Colecciones anidadas (si las hay) */}
          {arraySections.map((sec) => (
            <ArraySection key={sec.name} name={sec.name} rows={sec.rows} />
          ))}
        </div>
      )}
    </BaseCard>
  );
}
