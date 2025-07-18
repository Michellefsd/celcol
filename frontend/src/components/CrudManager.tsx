'use client';

import { useEffect, useState, ChangeEvent, ReactNode } from 'react';

export type FieldOption = {
  value: string;
  label: string;
};

export type Field = {
  name: string;
  label: string;
  type: string;
  options?: FieldOption[];
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
}: CrudConfig<T>) {
  const [data, setData] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    let url = endpoint;
    if (sortField) {
      url += `?sort=${String(sortField)}&dir=${sortDirection}`;
    }
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchData();
  }, [sortField, sortDirection]);

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
    if (!confirm('¿Seguro que querés borrar este registro?')) return;
    await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    fetchData();
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
  

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <input
          type="text"
          placeholder="Buscar..."
          className="border px-3 py-1 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <button
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => openModal()}
      >
        Crear nuevo
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={String(col)}
                  className="border px-2 py-1 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(col)}
                >
                  {String(col)}{' '}
                  {sortField === col && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              ))}
              <th className="border px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                {columns.map(col => (
                  <td key={String(col)} className="border px-2 py-1">
                    {renderValue(item, col)}
                  </td>
                ))}
                <td className="border px-2 py-1 flex gap-2">
                  <button onClick={() => onEditClick ? onEditClick(item) : openModal(item)}>
                    ✏️ {onEditLabel ? onEditLabel(item) : ''}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600"
                  >
                    🗑️
                  </button>
                  {extraActions && extraActions(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center overflow-y-auto">
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
                <div key={field.name} className="mb-3">
                  <label className="block mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={form[field.name as keyof T]?.toString() ?? ''}
                      onChange={handleChange}
                      className="w-full border px-2 py-1 bg-white text-black rounded"
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
                      className="w-full border px-2 py-1 bg-white text-black rounded"
                    />
                  )}
                </div>
              ))}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
