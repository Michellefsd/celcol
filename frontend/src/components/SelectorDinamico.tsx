'use client';

import { useState } from 'react';

type Opcion = {
  id: number;
  nombre: string;
};

type SeleccionDinamica = {
  id: number;
  nombre: string;
  cantidad?: number;
};

type Props = {
  label: string;
  opciones: Opcion[];
  conCantidad?: boolean;
  onChange: (seleccionados: SeleccionDinamica[]) => void;
};

export default function SelectorDinamico({ label, opciones, conCantidad = false, onChange }: Props) {
  const [seleccionados, setSeleccionados] = useState<SeleccionDinamica[]>([]);
  const [opcionActual, setOpcionActual] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);

  const handleAgregar = () => {
    if (opcionActual === null) return;
    const yaExiste = seleccionados.some(s => s.id === opcionActual);
    if (yaExiste) return;

    const opcion = opciones.find(o => o.id === opcionActual);
    if (!opcion) return;

    const nuevo: SeleccionDinamica = {
      id: opcion.id,
      nombre: opcion.nombre,
      ...(conCantidad ? { cantidad } : {}),
    };

    const nuevos = [...seleccionados, nuevo];
    setSeleccionados(nuevos);
    onChange(nuevos);
    setOpcionActual(null);
    setCantidad(1);
  };

  const handleEliminar = (id: number) => {
    const nuevos = seleccionados.filter((item) => item.id !== id);
    setSeleccionados(nuevos);
    onChange(nuevos);
  };

  const handleEditarCantidad = (id: number, nuevaCantidad: number) => {
    const nuevos = seleccionados.map((item) =>
      item.id === id ? { ...item, cantidad: nuevaCantidad } : item
    );
    setSeleccionados(nuevos);
    onChange(nuevos);
  };

  return (
    <div className="mb-6">
      <label className="block font-medium mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <select
          className="border rounded px-2 py-1"
          value={opcionActual ?? ''}
          onChange={(e) => setOpcionActual(Number(e.target.value))}
        >
          <option value="">Seleccionar...</option>
          {opciones.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nombre}
            </option>
          ))}
        </select>

        {conCantidad && (
          <input
            type="number"
            min={1}
            className="border rounded px-2 py-1 w-20"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />
        )}

        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handleAgregar}
        >
          +
        </button>
      </div>

      <ul className="mt-2 text-sm text-gray-700 space-y-1">
        {seleccionados.map((item) => (
          <li key={item.id} className="flex items-center justify-between border px-2 py-1 rounded">
            <span>
              {item.nombre}
              {conCantidad && (
                <input
                  type="number"
                  min={1}
                  value={item.cantidad ?? 1}
                  onChange={(e) => handleEditarCantidad(item.id, Number(e.target.value))}
                  className="ml-2 border rounded px-1 w-16 text-center"
                />
              )}
            </span>
            <button
              onClick={() => handleEliminar(item.id)}
              className="text-red-500 text-xs ml-4 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
