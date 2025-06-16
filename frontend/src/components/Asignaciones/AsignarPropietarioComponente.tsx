'use client';
import { useEffect, useState } from 'react';
import SubirArchivo8130Modal from './SubirArchivo8130';

type Propietario = {
  id: number;
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
};

type PropietarioOption = {
  value: string;
  label: string;
};

type Componente = {
  id: number;
  propietarioId: number;
};

type Props = {
  componente: Componente | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function AsignarPropietarioComponenteModal({
  componente,
  open,
  onClose,
  onSaved,
}: Props) {
  const [propietarios, setPropietarios] = useState<PropietarioOption[]>([]);
  const [seleccionado, setSeleccionado] = useState<string>('');
  const [error, setError] = useState('');
  const [mostrarSubir8130, setMostrarSubir8130] = useState(false);

  useEffect(() => {
    if (componente) {
      setSeleccionado(componente.propietarioId?.toString() ?? '');
    }
  }, [componente]);

  useEffect(() => {
    fetch('/api/propietarios')
      .then((res) => res.json())
      .then((data: Propietario[]) => {
        const opciones = data.map((p) => ({
          value: p.id.toString(),
          label: p.nombreEmpresa || `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim(),
        }));
        setPropietarios(opciones);
      });
  }, []);

  const guardar = async () => {
    if (!seleccionado) {
      setError('Seleccioná un propietario');
      return;
    }

    try {
      const res = await fetch(`/api/componentes/${componente?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propietarioId: parseInt(seleccionado) }),
      });

      if (!res.ok) throw new Error('Error al actualizar propietario');

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError('Error al asignar propietario');
      console.error(err);
    }
  };

  if (!open || !componente) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Asignar Propietario</h2>

          {error && <p className="text-red-600 mb-2">{error}</p>}

          <select
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            className="w-full border px-2 py-2 rounded mb-4"
          >
            <option value="">Seleccionar...</option>
            {propietarios.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMostrarSubir8130(true)}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded mb-4"
          >
            Subir archivo 8130
          </button>

          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">
              Cancelar
            </button>
            <button
              onClick={guardar}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE SUBIDA DE ARCHIVO */}
      {mostrarSubir8130 && (
        <SubirArchivo8130Modal
          componenteId={componente.id}
          open={mostrarSubir8130}
          onClose={() => setMostrarSubir8130(false)}
          onUploaded={() => {
            console.log('Archivo 8130 subido');
          }}
        />
      )}
    </>
  );
}
