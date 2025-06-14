/*'use client';
import { useEffect, useState } from 'react';

type PropietarioOption = {
  value: string;
  label: string;
};

type Props = {
  avionId: number;
  propietarios: PropietarioOption[];
  propietariosSeleccionados?: string[]; // nuevo
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AsignarPropietariosModal({
  avionId,
  propietarios,
  propietariosSeleccionados = [],
  onClose,
  onSuccess,
}: Props) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSeleccionados(propietariosSeleccionados);
  }, [propietariosSeleccionados]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const asignar = async () => {
    if (seleccionados.length === 0) {
      setError('Seleccioná al menos un propietario');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/aviones/${avionId}/propietarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propietariosIds: seleccionados.map((id) => parseInt(id)) }),
      });

      if (!res.ok) throw new Error('Error al asignar propietarios');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Error al asignar propietarios');
      console.error('Error:', err);
    }
  };

  const propietariosFiltrados = propietarios.filter((p) =>
    p.label.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Asignar Propietarios</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Buscar propietario..."
          className="w-full mb-3 px-3 py-2 border rounded"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {propietariosFiltrados.map((p) => (
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

          {propietariosFiltrados.length === 0 && (
            <p className="text-sm text-gray-500">No se encontraron propietarios.</p>
          )}
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
*/









'use client';
import { useEffect, useState } from 'react';

type PropietarioOption = {
  value: string;
  label: string;
};

type Props = {
  avionId: number;
  propietarios: PropietarioOption[];
  propietariosSeleccionados?: string[]; // <-- nueva prop
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AsignarPropietariosModal({
  avionId,
  propietarios,
  propietariosSeleccionados = [],
  onClose,
  onSuccess
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
      const res = await fetch(`http://localhost:3001/aviones/${avionId}/propietarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propietariosIds: seleccionados.map(id => parseInt(id)) }),
      });

      if (!res.ok) throw new Error('Error al asignar propietarios');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Error al asignar propietarios');
      console.log('Error:', err);
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
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
          <button onClick={asignar} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
        </div>
      </div>
    </div>
  );
}
