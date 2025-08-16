'use client';

import { useEffect, useState, ChangeEvent, ReactNode } from 'react';
import IconButton from './IconButton';
import { IconEliminar, IconEditar } from './ui/Icons';

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
  
}: CrudConfig<T>) {
  const [data, setData] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    const res = await fetch(endpoint);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    let newValue: unknown;

    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked;
    } else if (type === 'number') {
      newValue = value === '' ? null : parseFloat(value);
    } else if (type === 'date') {
      newValue = value === '' ? null : value;
    } else {
      newValue = value;
    }

    setForm(prev => ({
      ...prev,
      [name]: newValue as T[keyof T],
    }));
  };

  const handleSubmit = async () => {
    for (const field of formFields) {
  if (field.required && !form[field.name as keyof T]) {
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

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const created: T = await res.json();
      if (!editing && onAfterCreate) onAfterCreate(created);
      setForm({});
      setEditing(null);
      setShowModal(false);
      fetchData();
    }
  };

const handleDelete = async (id: number) => {
  if (!confirm('¿Querés archivar este registro?')) return;

  try {
    const res = await fetch(`${endpoint}/archivar/${id}`, { method: 'PATCH' });

    if (!res.ok) {
      const data = await res.json();
      const errorMessage = data?.error || 'Error al archivar el registro';
      alert(errorMessage);
      return;
    }

    fetchData();
  } catch (error) {
    alert('Error al conectar con el servidor');
    console.error('❌ Error en handleDelete:', error);
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
    if (Array.isArray(value)) {
      return value.map((v) => {
        if (
          typeof v === 'object' &&
          v !== null &&
          'propietario' in v &&
          typeof v.propietario === 'object'
        ) {
          const p = v.propietario;
          return p.nombreEmpresa || `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim();
        }
        return '';
      }).join(', ');
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      ('nombreEmpresa' in value || 'nombre' in value || 'apellido' in value)
    ) {
      const p = value as { nombreEmpresa?: string; nombre?: string; apellido?: string };
      if (p.nombreEmpresa) return p.nombreEmpresa;
      if (p.nombre || p.apellido) return `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim();
    }
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return value !== undefined && value !== null ? String(value) : '';
  };

  const filteredData = data.filter(item =>
    columns.some(col =>
      renderValue(item, col).toLowerCase().includes(searchTerm.toLowerCase())
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

    // Date string
    if (
      typeof valA === 'string' &&
      typeof valB === 'string' &&
      !isNaN(Date.parse(valA)) &&
      !isNaN(Date.parse(valB))
    ) {
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // Number
    if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
      return sortDirection === 'asc'
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    return 0;
  });
/*
 return (
  <div className="px-4 py-6 max-w-screen-2xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
      <h1 className="text-2xl font-bold py-2">{title}</h1>
      <input
        type="text"
        placeholder="Buscar..."
        className="border px-3 py-2 rounded w-full sm:w-auto"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <button
      className="mb-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      onClick={() => openModal()}
    >
      Crear nuevo
    </button>

    <div className="overflow-x-auto">
      <table className="w-full min-w-full border text-sm">
        <thead className="bg-gray-100 text-rose-900">
          <tr>
            {columns.map(col => (
              <th
                key={String(col)}
                className="border px-3 text-center font-semibold cursor-pointer hover:bg-rose-200"
                onClick={() => handleSort(col)}
              >
                {String(col)}{' '}
                {sortField === col && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
            ))}
            <th className="border px-3 py-1 text-left font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(item => (
            <tr key={item.id} className={rowClassName?.(item)}>
              {columns.map(col => (
                <td key={String(col)} className="border px-3">
                  {renderValue(item, col)}
                </td>
              ))}
              <td className="border px-3 py-1">
                <div className="flex flex-wrap gap-2">
                  <IconButton
                    icon={IconEditar}
                    title="Editar"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => onEditClick ? onEditClick(item) : openModal(item)}
                  />
                  <IconButton
                    icon={IconEliminar}
                    title="Eliminar"
                    className="text-red-600 hover:text-red-800"
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

    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center overflow-y-auto z-50">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md mt-20 mb-20 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">
            {editing ? 'Editar' : 'Crear'} {title}
          </h2>

          {formFields
            .filter(field => {
              const tipoPropietarioActual = (form as { tipoPropietario?: string })?.tipoPropietario;

              if (!tipoPropietarioActual) return true;

              if (['nombreEmpresa', 'rut'].includes(field.name)) {
                return tipoPropietarioActual === 'INSTITUCION';
              }
              if (['nombre', 'apellido'].includes(field.name)) {
                return tipoPropietarioActual === 'PERSONA';
              }
              return true;
            })
            .map(field => (
              <div key={field.name} className="mb-4">
                <label className="block mb-1 font-medium">
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={form[field.name as keyof T]?.toString() ?? ''}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 bg-white text-black rounded"
                  >
                    <option value="">Seleccionar...</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.name}
                    type={field.type}
                    value={
                      field.type === 'checkbox'
                        ? undefined
                        : form[field.name as keyof T]?.toString() ?? ''
                    }
                    checked={
                      field.type === 'checkbox'
                        ? Boolean(form[field.name as keyof T])
                        : undefined
                    }
                    onChange={handleChange}
                    className="w-full border px-3 py-2 bg-white text-black rounded"
                  />
                )}
              </div>
            ))}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
*/

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
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col)}
                  className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort(col)}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{String(col)}</span>
                    {sortField === col && (
                      <span className="text-slate-500">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedData.map((item, idx) => (
              <tr
                key={item.id}
                className={`${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                } hover:bg-slate-50 transition-colors ${rowClassName?.(item) || ''}`}
              >
                {columns.map((col) => (
                  <td key={String(col)} className="px-3 py-2 text-slate-800">
                    {renderValue(item, col)}
                  </td>
                ))}
                <td className="px-3 py-2">
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
