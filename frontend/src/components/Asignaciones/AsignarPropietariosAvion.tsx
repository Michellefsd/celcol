'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api'; 

type PropietarioOption = {
  value: string;
  label: string;
};

type Props = {
  avionId: number;
  propietarios: PropietarioOption[];
  propietariosSeleccionados?: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AsignarPropietariosAvionModal({
  avionId,
  propietarios,
  propietariosSeleccionados = [],
  onClose,
  onSuccess,
}: Props) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setSeleccionados(propietariosSeleccionados);
  }, [propietariosSeleccionados]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const asignar = async () => {
    if (seleccionados.length === 0) {
      setError('Seleccioná al menos un propietario');
      return;
    }
    try {
      const res = await fetch(api(`/aviones/${avionId}/asignar-propietarios`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propietariosIds: seleccionados.map(id => parseInt(id)) }),
      });

      if (!res.ok) throw new Error('Error al asignar propietarios');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Error al asignar propietarios');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Asignar Propietarios</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {propietarios.map((p) => (
            <label key={p.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={p.value}
                checked={seleccionados.includes(p.value)}
                onChange={() => toggleSeleccion(p.value)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">
            Cancelar
          </button>
          <button onClick={asignar} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
