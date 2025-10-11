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
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h4 className="font-semibold text-slate-800">{titulo}</h4>
        <span className="text-sm text-slate-500">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-slate-400 text-lg">📋</span>
          </div>
          <p className="text-sm text-slate-500">Ninguno asignado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3
                         hover:border-slate-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-800 font-medium">{item.nombre}</span>
                {item.meta && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {item.meta}
                  </span>
                )}
                {conCantidad && editable ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Cantidad:</label>
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={item.cantidad ?? 1}
                      onChange={(e) => onEditarCantidad?.(index, parseFloat(e.target.value))}
                    />
                  </div>
                ) : conCantidad ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    x {item.cantidad}
                  </span>
                ) : null}
              </div>
              {editable && (
                <button
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors duration-200
                             transform hover:scale-105"
                  onClick={() => onEliminar(index)}
                  title="Eliminar"
                >
                  <span className="text-sm">🗑️</span>
                </button>
              )}
            </div>
          ))}
        </div>
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