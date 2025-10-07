'use client';

import { useRouter } from 'next/navigation';
import { titleFor } from '@/lib/labels';

const items = [
  { label: 'Propietarios', slug: 'propietarios' },
  { label: titleFor('avion'), slug: 'aviones' },
  { label: 'Stock', slug: 'stock' },
  { label: 'Herramientas', slug: 'herramientas' },
  { label: 'Personal', slug: 'personal' },
] as const;

export default function EntidadMenu() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {items.map(({ label, slug }) => {
        const ruta = `/cruds/${slug}`;
        return (
          <button
            key={slug}
            onClick={() => router.push(ruta)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-medium">{label}</span>
              <span className="text-cyan-600">Ver</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
