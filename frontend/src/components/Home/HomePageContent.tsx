'use client';

import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';
import { useRouter } from 'next/navigation';
import IconButton from '../IconButton'
import { IconDescargar } from '../ui/Icons';
import { api } from '@/services/api'; // asegúrate de tener este helper

export default function HomePageContent() {
  const router = useRouter();

  const abrir = (ruta: string) => {
    const win = window.open('about:blank', '_blank');
    if (win) setTimeout(() => (win.location.href = ruta), 60);
    else window.open(ruta, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
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

          {/* Columna derecha */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
            <EntidadMenu />

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-sm font-medium">Plantillas en blanco</div>
              <div className="flex gap-2">
                <IconButton
                  icon={IconDescargar}
                  title="CCM (en blanco)"
                  label="CCM (en blanco)"
                  onClick={() => abrir(api('/ordenes-trabajo/plantilla-en-blanco/ccm'))}
                />
                <IconButton
                  icon={IconDescargar}
                  title='PDF (en blanco)'
                  label="PDF (en blanco)"
                  onClick={() => abrir(api('/ordenes-trabajo/plantilla-en-blanco/conformidad'))}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
