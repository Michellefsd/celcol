/*'use client';

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
          onClick={() => router.push(ruta)}
          className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-gray-800"
        >
          <span className="font-medium">{entidad}</span>
        </button>
      );
    })}
  </div>
);
}
*/


'use client';

import { useRouter } from 'next/navigation';

const entidades = ['Propietarios', 'Aviones', 'Stock', 'Herramientas', 'Personal'];

export default function EntidadMenu() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {entidades.map((entidad) => {
        const ruta = `/cruds/${entidad.toLowerCase()}`;
        return (
          <button
            key={entidad}
            onClick={() => router.push(ruta)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-medium">{entidad}</span>
              <span className="text-cyan-600">Ver</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
