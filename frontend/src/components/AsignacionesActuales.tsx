'use client';

import { useState } from 'react';

interface Item {
  id: number;
  nombre: string;
  cantidad?: number;
  meta?: string; // metainformación adicional (rol, tipo, etc.)
}

interface Props {
  titulo: string;
  items: Item[];
  conCantidad?: boolean;
  editable?: boolean;
  onEliminar: (index: number) => void;
  onEditarCantidad?: (index: number, nuevaCantidad: number) => void;
}

export default function AsignacionesActuales({
  titulo,
  items,
  conCantidad = false,
  editable = false,
  onEliminar,
  onEditarCantidad,
}: Props) {
  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">{titulo}</h4>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Ninguno asignado.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className="flex items-center justify-between border px-3 py-1 rounded"
            >
              <div className="flex items-center gap-2">
                <span>{item.nombre}</span>
                {item.meta && <span className="text-xs text-gray-500">({item.meta})</span>}
                {conCantidad && editable ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-0.5 w-20 text-sm"
                    value={item.cantidad ?? 1}
                    onChange={(e) => onEditarCantidad?.(index, parseFloat(e.target.value))}
                  />
                ) : conCantidad ? (
                  <span className="text-sm">x {item.cantidad}</span>
                ) : null}
              </div>
              {editable && (
                <button
                  className="text-red-600 text-sm hover:underline"
                  onClick={() => onEliminar(index)}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Uso sugerido:
// Para herramientas:
// <AsignacionesActuales titulo="Herramientas asignadas" items={herramientasSeleccionadas} editable onEliminar={...} />

// Para técnicos:
// <AsignacionesActuales titulo="Técnicos asignados" items={tecnicosSeleccionados} editable onEliminar={...} />

// Para certificadores:
// <AsignacionesAct