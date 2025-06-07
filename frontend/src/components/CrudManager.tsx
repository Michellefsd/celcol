'use client';

import { useEffect, useState, ChangeEvent } from 'react';

type Field = {
  name: string;
  label: string;
  type: string;
};

type CrudManagerProps<T> = {
  title: string;
  endpoint: string;
  columns: (keyof T)[];
  formFields: Field[];
};

export default function CrudManager<T extends { id: number }>({
  title,
  endpoint,
  columns,
  formFields,
}: CrudManagerProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [showModal, setShowModal] = useState(false);

const fetchData = async () => {
  const res = await fetch(endpoint);
  const json = await res.json();
  console.log(Array.isArray(json), json);  
  console.log('Respuesta del backend:', json); // 👈 Agregá esto
  setData(json);
};

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;

    let newValue: string | number | boolean | Date | null;

    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'number') {
      newValue = value === '' ? null : parseFloat(value);
    } else if (type === 'date') {
      newValue = value === '' ? null : new Date(value);
    } else {
      newValue = value;
    }

    setForm(prev => ({
      ...prev,
      [name]: newValue as T[keyof T],
    }));
  };

  const handleSubmit = async () => {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${endpoint}/${editing.id}` : endpoint;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setForm({});
    setEditing(null);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que querés borrar este registro?')) return;
    await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openModal = (item?: T) => {
    setEditing(item ?? null);
    setForm(item ?? {});
    setShowModal(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
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
                <th key={String(col)} className="border px-2 py-1">
                  {String(col)}
                </th>
              ))}
              <th className="border px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                {columns.map(col => (
                  <td key={String(col)} className="border px-2 py-1">
                    {String(item[col])}
                  </td>
                ))}
                <td className="border px-2 py-1 flex gap-2">
                  <button onClick={() => openModal(item)}>✏️</button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md mt-20 mb-20">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? 'Editar' : 'Crear'} {title}
            </h2>
            {formFields.map(field => (
              <div key={field.name} className="mb-3">
                <label className="block mb-1">{field.label}</label>
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
