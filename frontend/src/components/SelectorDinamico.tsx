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
  maximos?: Record<number, number>;
  permitirDuplicados?: boolean;
  excluidos?: number[];
  onChange: (seleccionados: SeleccionDinamica[]) => void;
};

export default function SelectorDinamico({
  label,
  opciones,
  conCantidad = false,
  maximos = {},
  permitirDuplicados = false,
  excluidos = [],
  onChange,
}: Props) {
  const [seleccionados, setSeleccionados] = useState<SeleccionDinamica[]>([]);
  const [opcionActual, setOpcionActual] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);

  const handleAgregar = () => {
    if (opcionActual === null) return;

    if (!permitirDuplicados) {
      const yaExiste = seleccionados.some(s => s.id === opcionActual);
      if (yaExiste) return;
    }

    const opcion = opciones.find(o => o.id === opcionActual);
    if (!opcion) return;

    const max = maximos[opcion.id] ?? Infinity;
    const cantidadFinal = Math.min(cantidad, max);

    const nuevo: SeleccionDinamica = {
      id: opcion.id,
      nombre: opcion.nombre,
      ...(conCantidad ? { cantidad: cantidadFinal } : {}),
    };

    const nuevos = [...seleccionados, nuevo];
    setSeleccionados(nuevos);
    onChange(nuevos);
    setOpcionActual(null);
    setCantidad(1);
  };

  const handleEliminar = (index: number) => {
    const nuevos = seleccionados.filter((_, i) => i !== index);
    setSeleccionados(nuevos);
    onChange(nuevos);
  };

  const handleEditarCantidad = (index: number, nuevaCantidad: number) => {
    const item = seleccionados[index];
    const max = maximos[item.id] ?? Infinity;
    const cantidadFinal = Math.min(nuevaCantidad, max);

    const nuevos = [...seleccionados];
    nuevos[index] = { ...item, cantidad: cantidadFinal };

    setSeleccionados(nuevos);
    onChange(nuevos);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-800 mb-3">{label}</label>
      
      {/* Selector mejorado */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3">
          <select
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-all duration-200 hover:border-slate-400"
            value={opcionActual ?? ''}
            onChange={(e) => setOpcionActual(Number(e.target.value))}
          >
            <option value="">Seleccionar {label.toLowerCase()}...</option>
            {opciones
              .filter((op) => !(excluidos ?? []).includes(op.id))
              .map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre}
                </option>
              ))}
          </select>

          {conCantidad && opcionActual !== null && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Cantidad:</label>
              <input
                type="number"
                min={1}
                max={maximos[opcionActual] ?? undefined}
                className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-200"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>
          )}

          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-xl px-4 py-3 font-medium transition-all duration-200
                       ${opcionActual !== null 
                         ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 shadow-lg' 
                         : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                       }`}
            onClick={handleAgregar}
            disabled={opcionActual === null}
          >
            <span className="mr-2">+</span>
            Agregar
          </button>
        </div>

        {/* Lista de seleccionados temporal */}
        {seleccionados.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h5 className="text-sm font-medium text-slate-700 mb-2">Seleccionados (pendientes de guardar):</h5>
            <div className="space-y-2">
              {seleccionados.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-800 font-medium">{item.nombre}</span>
                    {conCantidad && (
                      <span className="text-sm text-slate-500">
                        x {item.cantidad}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition-colors duration-200"
                    onClick={() => handleEliminar(index)}
                  >
                    <span className="text-sm">✕</span>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              💡 Recuerda hacer clic en "Guardar" para confirmar estos cambios
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
