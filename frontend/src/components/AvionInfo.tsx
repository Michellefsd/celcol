'use client';

import { useState } from 'react';
import BaseHeading from './BaseHeading';
import BaseCard from './BaseCard';
import BaseButton from './BaseButton';
import { getAvionPorMatricula } from '../services/api';
import { AvionConClientes } from '../types/index';

export default function AvionInfo() {
  const [matricula, setMatricula] = useState('');
  const [data, setData] = useState<AvionConClientes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const resultado = await getAvionPorMatricula(matricula);
      setData(resultado);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseCard>
      <BaseHeading>Buscar avión por matrícula</BaseHeading>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          placeholder="Ej: CX-ABC"
          className="border border-gray-300 px-4 py-2 rounded-xl flex-1"
        />
        <BaseButton onClick={handleSearch}>Buscar</BaseButton>
      </div>

      {loading && <p className="text-gray-500">Buscando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="mt-4">
          <p className="text-lg font-medium mb-2">
            Avión: {data.avion.modelo} ({data.avion.matricula})
          </p>
          <p className="font-semibold">Dueños:</p>
          <ul className="list-disc list-inside">
            {data.duenios.map((d) => (
              <li key={d.id}>
                {d.nombre} — {d.email ?? 'sin email'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </BaseCard>
  );
}
