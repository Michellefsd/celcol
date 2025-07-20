'use client';

import { useState } from 'react';
import { Combobox } from '@headlessui/react';

interface Opcion {
  id: number;
  nombre: string;
}

interface Props {
  opciones: Opcion[];
  valor: number | null;
  setValor: (valor: number | null) => void;
  label: string;
  placeholder?: string;
}

export default function ComboboxBuscador({
  opciones,
  valor,
  setValor,
  label,
  placeholder = 'Buscar...',
}: Props) {
  const [query, setQuery] = useState('');

  const filtradas = query === ''
    ? opciones
    : opciones.filter((o) =>
        o.nombre.toLowerCase().includes(query.toLowerCase())
      );

  const nombreSeleccionado = opciones.find((o) => o.id === valor)?.nombre ?? '';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Combobox value={valor} onChange={setValor}>
        <div className="relative">
          <Combobox.Input
            className="w-full border px-3 py-2 rounded"
            displayValue={() => nombreSeleccionado}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          {filtradas.length > 0 && (
            <Combobox.Options className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-auto shadow">
              {filtradas.map((op) => (
                <Combobox.Option
                  key={op.id}
                  value={op.id}
                  className={({ active }) =>
                    `px-3 py-2 cursor-pointer ${active ? 'bg-blue-100' : ''}`
                  }
                >
                  {op.nombre}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  );
}
