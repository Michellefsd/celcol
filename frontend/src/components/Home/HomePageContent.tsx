'use client';

import { useState } from 'react';                 // ⬅️ agrega esto
import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';
import { useRouter } from 'next/navigation';
import BotonesPlantillas from '../DownloadTemplates';

export default function HomePageContent() {
  const router = useRouter();
  const [otId, setOtId] = useState<string>('');   // ⬅️ ID de OT a usar en las plantillas

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda (OTs) */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <BaseButton variant="primary" onClick={() => router.push('/ordenes-trabajo/nueva')}>
                Nuevo trabajo
              </BaseButton>

              <BaseButton variant="secondary" onClick={() => router.push('/archivadas')}>
                Archivados
              </BaseButton>
            </div>
            <TrabajoCard />
          </div>

          {/* Columna derecha (menú de entidades + plantillas) */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
            <EntidadMenu />

            {/* Selector simple de OT + botones */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-sm font-medium">Descargar plantillas editables</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="ID de OT…"
                  value={otId}
                  onChange={(e) => setOtId(e.target.value)}
                  className="w-40 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                />
                <BotonesPlantillas ordenId={otId} disabled={!otId} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Ingresá el ID de la OT para pre-rellenar la plantilla (matrícula, marca, etc.).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
