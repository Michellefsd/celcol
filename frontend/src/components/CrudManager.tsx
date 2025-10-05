'use client';

import { useEffect, useState, ChangeEvent, ReactNode } from 'react';
import IconButton from './IconButton';
import { IconEliminar, IconEditar } from './ui/Icons';
import { fetchJson } from '@/services/api';

// === Helpers de formato ===
const DATE_KEYS_REGEX = /(fecha|vencimiento|date|createdat|updatedat|tbo(fecha)?)/i;

function isIsoDateTime(v: unknown) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);
}
function isDateOnly(v: unknown) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
function toIsoDateUTC(value: unknown): string {
  // Devuelve 'YYYY-MM-DD' sin corrimientos
  if (value == null) return '—';
  if (isDateOnly(value)) return value as string;
  if (isIsoDateTime(value)) return (value as string).slice(0, 10);

  const d = new Date(value as any);
  if (!isNaN(d as any)) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(value ?? '—');
}

  
const LIC_LABELS: Record<string, string> = {
  CELULA: 'Célula',
  MOTOR: 'Motor',
  AVIONICA: 'Aviónica',
};

  //HELPERS TO DATE FORMATTING
  function formatUY(value: unknown) {
  if (value == null || value === '') return '—';

  // 1) 'YYYY-MM-DD' → leer directo (sin Date()) para evitar TZ
  if (isDateOnly(value)) {
    const s = String(value);            // 'YYYY-MM-DD'
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }

  // 2) ISO con hora 'YYYY-MM-DDTHH:mm:ssZ' → tomar los primeros 10 chars
  if (isIsoDateTime(value)) {
    const s = String(value).slice(0, 10); // 'YYYY-MM-DD'
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }

  // 3) Date u otros → caemos a Date pero usando UTC para evitar corrimientos
  const dt = new Date(value as any);
  if (isNaN(+dt)) return String(value ?? '—');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dt.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const isEmptyForRequired = (v: unknown) =>
  v === null ||
  v === undefined ||
  (Array.isArray(v) && v.length === 0) ||   // 👈 agrega arrays vacíos
  (typeof v === 'string' && v.trim() === '') ||
  (typeof v === 'number' && Number.isNaN(v));


function maybeFormatDate(value: unknown, key?: string) {
  const looksLikeDate =
    (typeof key === 'string' && DATE_KEYS_REGEX.test(key)) ||
    isIsoDateTime(value) ||
    isDateOnly(value) ||
    value instanceof Date;

  if (looksLikeDate) return formatUY(value);
  if (value === '' || value == null) return '—';
  return String(value);
}
function formatPropietarios(list: any[]): string {
  if (!Array.isArray(list) || list.length === 0) return '—';
  const nombres = list.map((item) => {
    const p = item?.propietario ?? item;
    const tipo = (p?.tipoPropietario ?? '').toUpperCase();
    if (tipo === 'INSTITUCION') {
      return p?.nombreEmpresa ?? p?.nombre ?? '—';
    }
    const full = `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim();
    return full || '—';
  });
  return nombres.filter(Boolean).join(', ');
}


export type FieldOption = {
  value: string;
  label: string;
};

export type Field = {
  name: string;
  label: string;
  type: string;
  options?: FieldOption[];
  required?: boolean;
  multiple?: boolean;
};

export type CrudConfig<T extends { id: number }> = {
  title: string;
  endpoint: string;
  columns: (keyof T)[];
  formFields: Field[];
  onAfterCreate?: (created: T) => void;
  onBeforeSubmit?: (form: Partial<T>) => string | null;
  extraActions?: (item: T) => ReactNode;
  onEditLabel?: (item: T) => string;
  onEditClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  columnLabels?: Partial<Record<keyof T | string, string>>;
  renderCell?: (key: keyof T | string, item: T) => ReactNode;  // ← NUEVO

};

export default function CrudManager<T extends { id: number }>({
  title,
  endpoint,
  columns,
  formFields,
  onAfterCreate,
  onBeforeSubmit,
  extraActions,
  onEditLabel,
  onEditClick,
  rowClassName,
  columnLabels,
  renderCell
}: CrudConfig<T>) {
  const [data, setData] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

const fetchData = async () => {
    try {
      const body = await fetchJson(endpoint);
      const list = Array.isArray(body)
        ? body
        : (body && Array.isArray((body as any).items) ? (body as any).items : []);
      setData(list as T[]);
    } catch (err) {
  console.warn('⚠️ CRUD load warning:', err);
  setData([]);
}

  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);


  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const el = e.target;
  let newValue: unknown;
  let name = '';

  if (el instanceof HTMLSelectElement) {
    name = el.name;
    newValue = el.multiple
      ? Array.from(el.selectedOptions, (o) => o.value)
      : el.value;
  } else if (el instanceof HTMLInputElement) {
    name = el.name;
    switch (el.type) {
      case 'checkbox':
        newValue = el.checked;
        break;
      case 'number':
        newValue = el.value === '' ? null : parseFloat(el.value);
        break;
      case 'date':
        newValue = el.value === '' ? null : el.value; // 'YYYY-MM-DD'
        break;
      default:
        newValue = el.value;
    }
  } else {
    // fallback ultra conservador
    // @ts-expect-error: generic target
    name = el.name ?? '';
    // @ts-expect-error: generic target
    newValue = el.value ?? '';
  }

  setForm((prev) => ({
    ...prev,
    [name]: newValue as T[keyof T],
  }));
};


  
const handleSubmit = async () => {
  for (const field of formFields) {
    if (field.required && isEmptyForRequired(form[field.name as keyof T])) {
      alert(`El campo "${field.label}" es obligatorio`);
      return;
    }
    }
    if (onBeforeSubmit) {
      const errorMessage = onBeforeSubmit(form);
      if (errorMessage) {
        alert(errorMessage);
        return;
      }
    }

    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${endpoint}/${editing.id}` : endpoint;

    try {
      const payload = await fetchJson(url, {
        method,
        body: JSON.stringify(form),
      });
      if (!editing && onAfterCreate && payload) onAfterCreate(payload as T);
      setForm({});
      setEditing(null);
      setShowModal(false);
      fetchData();
    } catch (e: any) {
  console.warn('⚠️ handleSubmit warning:', e);
  alert(e?.message ?? 'Error al procesar la solicitud');
}
  };


  const handleDelete = async (id: number) => {
    if (!confirm('¿Querés archivar este registro?')) return;

try {
      await fetchJson(`${endpoint}/archivar/${id}`, { method: 'PATCH' });
      fetchData();
} catch (error: any) {
  console.warn('⚠️ handleDelete warning:', error);
  alert(error?.message ?? 'Error');
}
  };


  const openModal = (item?: T) => {
    const defaultForm: Partial<T> = item ?? {};
    const hasTipoPropietario = formFields.some(f => f.name === 'tipoPropietario');

    setForm({
      ...defaultForm,
      ...(hasTipoPropietario && !item ? { tipoPropietario: 'PERSONA' as T[keyof T] } : {}),
    });

    setEditing(item ?? null);
    setShowModal(true);
  };

  const getStringField = (name: string): string => {
    const value = form[name as keyof T];
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      const v = value as { nombreEmpresa?: string; nombre?: string; apellido?: string };
      if (v.nombreEmpresa) return v.nombreEmpresa;
      if (v.nombre || v.apellido) return `${v.nombre ?? ''} ${v.apellido ?? ''}`.trim();
    }
    return '';
  };



const renderValue = (item: T, key: keyof T): string => {
  const value = item[key];

  // Arrays de strings (ej. tipoLicencia)
  if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
    const arr = value as string[];
    const pretty = arr.map(v => LIC_LABELS[v] ?? v).join(', ');
    return pretty || '—';
  }

  // Columna propietarios (array de objetos)
  if (Array.isArray(value)) {
    const preview = formatPropietarios(value as any[]);
    if (preview !== '—') return preview;
    // fallback genérico para arrays
    return value.map((v) => String(v)).join(', ');
  }

  // Objeto dueño/propietario suelto
  if (
    typeof value === 'object' &&
    value !== null &&
    ('nombreEmpresa' in (value as any) || 'nombre' in (value as any) || 'apellido' in (value as any))
  ) {
    const p = value as { nombreEmpresa?: string; nombre?: string; apellido?: string };
    if (p.nombreEmpresa) return p.nombreEmpresa;
    const full = `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim();
    return full || '—';
  }

  // Boolean
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';

  // Fecha u otros tipos
  return maybeFormatDate(value, String(key));
};



  const baseData = Array.isArray(data) ? data : [];
  const filteredData = baseData.filter((item) =>
    columns.some((col) =>
      (renderValue(item, col) || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;

    const valA = a[sortField];
    const valB = b[sortField];

    if (valA == null && valB != null) return 1;
    if (valA != null && valB == null) return -1;
    if (valA == null && valB == null) return 0;

    // String
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
        : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
    }

    // Date-like (string/Date) → normalizamos a YYYY-MM-DD (UTC) y comparamos
const aDateLike =
  (typeof valA === 'string' && (isIsoDateTime(valA) || isDateOnly(valA))) || valA instanceof Date;
const bDateLike =
  (typeof valB === 'string' && (isIsoDateTime(valB) || isDateOnly(valB))) || valB instanceof Date;

if (aDateLike && bDateLike) {
  const aKey = toIsoDateUTC(valA as any); // 'YYYY-MM-DD'
  const bKey = toIsoDateUTC(valB as any);
  // comparar lexicográficamente YYYY-MM-DD es correcto
  if (sortDirection === 'asc') return aKey.localeCompare(bKey);
  return bKey.localeCompare(aKey);
}


    // Number
    if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
      return sortDirection === 'asc'
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    return 0;
  });

return (
  <div className="min-h-screen bg-slate-100">
    <div className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
      {/* Título + búsqueda */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-3 py-2
                     text-slate-800 placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CTA principal */}

      <div className="mb-6">
        <button
          className="inline-flex items-center justify-center rounded-xl
                     bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
                     font-semibold text-base px-6 py-3 shadow-sm
                     hover:from-[#4a6ee0] hover:to-[#3658d4]
                     hover:shadow-lg hover:brightness-110
                     transform hover:scale-[1.03] transition-all duration-300"
          onClick={() => openModal()}
        >
          Crear nuevo
        </button>
      </div>

      {/* Tabla */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
       <table className="w-full min-w-max text-sm">
       <thead className="sticky top-0 z-10 bg-slate-50">
  <tr>
    {columns.map((col) => (
      <th
        key={String(col)}
        className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
        onClick={() => handleSort(col)}
        aria-sort={sortField === col ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <div className="inline-flex items-center gap-1">
          {/* usa el label si existe; si no, muestra la key */}
          <span>{columnLabels?.[String(col)] ?? String(col)}</span>
          {sortField === col && (
            <span className="text-slate-500">{sortDirection === 'asc' ? '▲' : '▼'}</span>
          )}
        </div>
      </th>
    ))}
    <th
   className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200
              sticky right-0 z-20 bg-slate-50 border-l border-slate-200"
 >
   Acciones
 </th>
  </tr>
</thead>

<tbody className="divide-y divide-slate-200">
  {sortedData.map((item, idx) => (
<tr
   key={item.id}
   className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-50 transition-colors ${rowClassName?.(item) || ''}`}
 >
      {columns.map((col) => {
        const custom = renderCell?.(col as any, item);
        return (
          <td key={String(col)} className="px-3 py-2 text-slate-800">
            {custom !== undefined ? custom : renderValue(item, col)}
          </td>
        );
      })}

      <td
   className={`px-3 py-2 sticky right-0 z-10 border-l border-slate-200
               ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} group-hover:bg-slate-50`}
 >
   <div className="flex flex-wrap gap-2">
          <IconButton
            icon={IconEditar}
            title="Editar"
            className="text-slate-700 hover:text-slate-900"
            onClick={() => (onEditClick ? onEditClick(item) : openModal(item))}
          />
          <IconButton
            icon={IconEliminar}
            title="Eliminar"
            className="text-rose-600 hover:text-rose-700"
            onClick={() => handleDelete(item.id)}
          />
          {extraActions && extraActions(item)}
        </div>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>

      {/* Modal */}

{showModal && (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col">
      {/* Header */}

      <div className="px-6 pt-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {editing ? 'Editar' : 'Crear'} {title}
        </h2>
      </div>

      {/* Body scrolleable */}

      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
        {formFields
          .filter((field) => {
            const tipoPropietarioActual = (form as { tipoPropietario?: string })?.tipoPropietario;
            if (!tipoPropietarioActual) return true;
            if (['nombreEmpresa', 'rut'].includes(field.name)) return tipoPropietarioActual === 'INSTITUCION';
            if (['nombre', 'apellido'].includes(field.name)) return tipoPropietarioActual === 'PERSONA';
            return true;
          })
          .map((field) => (
            <div key={field.name} className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label}
                {field.required && <span className="text-rose-600 ml-1">*</span>}
              </label>

{field.type === 'select' ? (
  field.multiple ? (
    // ✅ Render como checkboxes cuando es múltiple
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(field.options ?? []).map((opt) => {
        const arr = Array.isArray(form[field.name as keyof T])
          ? (form[field.name as keyof T] as unknown as string[])
          : [];
        const checked = arr.includes(opt.value);
        return (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = new Set(arr);
                if (e.target.checked) next.add(opt.value);
                else next.delete(opt.value);
                setForm((prev) => ({
                  ...prev,
                  [field.name]: Array.from(next) as T[keyof T],
                }));
              }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  ) : (
    // ⬇️ select simple (una sola opción)
    <select
      name={field.name}
      value={form[field.name as keyof T]?.toString() ?? ''}
      onChange={handleChange}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
      aria-required={field.required ? 'true' : 'false'}
    >
      <option value="">Seleccionar...</option>
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
) : (
  <input
    name={field.name}
    type={field.type}
    value={field.type === 'checkbox' ? undefined : form[field.name as keyof T]?.toString() ?? ''}
    checked={field.type === 'checkbox' ? Boolean(form[field.name as keyof T]) : undefined}
    onChange={handleChange}
    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
               focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
    aria-required={field.required ? 'true' : 'false'}
  />
)}
            </div>
          ))}
      </div>

      {/* Footer fijo */}

      <div className="px-6 pb-6 pt-2 border-t border-slate-200 flex justify-end gap-2">
        <button
          onClick={() => setShowModal(false)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                     px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                     transform hover:scale-[1.02] transition-all duration-200"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center justify-center rounded-xl
                     bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
                     font-semibold px-6 py-2.5 shadow-sm
                     hover:from-[#4a6ee0] hover:to-[#3658d4]
                     hover:shadow-lg hover:brightness-110
                     transform hover:scale-[1.03] transition-all duration-300"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  </div>
);

}