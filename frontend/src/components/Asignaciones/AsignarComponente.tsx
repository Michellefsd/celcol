'use client';

import { ChangeEvent, useState } from 'react';
import { api, apiFetch } from '@/services/api'; 

interface Props {
  propietarioId: number;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AgregarComponenteModal({ propietarioId, open, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    numeroParte: '',
    TSN: '',
    TSO: '',
    TBOHoras: '',
    TBOFecha: '',
    archivo8130: null as File | null,
  });
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const guardar = async () => {
    const { marca, modelo, numeroSerie, archivo8130, ...rest } = formData;
    if (!marca || !modelo || !numeroSerie) {
      setError('Marca, modelo y número de serie son obligatorios');
      return;
    }

    try {
      const body = new FormData();
      body.append('propietarioId', propietarioId.toString());
      body.append('marca', marca);
      body.append('modelo', modelo);
      body.append('numeroSerie', numeroSerie);
      if (archivo8130) body.append('archivo8130', archivo8130);

      for (const [key, value] of Object.entries(rest)) {
        if (value) body.append(key, value);
      }

      await apiFetch('/componentes', {
        method: 'POST',
        body, // FormData ⇒ el helper maneja headers + cookies + refresh
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
        <h2 className="text-xl font-semibold">Agregar componente externo</h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {[
  { name: 'tipo', type: 'text' },
  { name: 'marca', type: 'text' },
  { name: 'modelo', type: 'text' },
  { name: 'numeroSerie', type: 'text' },
  { name: 'numeroParte', type: 'text' },
  { name: 'TSN', type: 'number' },
  { name: 'TSO', type: 'number' },
  { name: 'TBOHoras', type: 'number' },
  { name: 'TBOFecha', type: 'date' },
  { name: 'archivo8130', type: 'file' }
].map(({ name, type }) => (
  <div key={name} className="flex flex-col">
    <label className="text-sm capitalize">{name}</label>
    <input
      type={type}
      name={name}
      onChange={handleChange}
      className="border p-2 rounded"
      accept={type === 'file' ? 'application/pdf' : undefined}
      {...(type !== 'file' ? { value: formData[name as keyof typeof formData] as string } : {})}
    />
  </div>
))}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          <button onClick={guardar} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
}
