'use client';

import { useRouter } from 'next/navigation';

const entidades = ['Propietarios', 'Aviones', 'Stock', 'Herramientas', 'Personal'];

export default function EntidadMenu() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {entidades.map((entidad) => {
        const ruta = `/cruds/${entidad.toLowerCase()}`;
        return (
          <button
            key={entidad}
            className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow hover:bg-gray-50 transition"
            onClick={() => router.push(ruta)}
          >
            {entidad}
          </button>
        );
      })}
    </div>
  );
}
