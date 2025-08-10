'use client';

/*
import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';
import { useRouter } from 'next/navigation'; 
import AccionBoton from '../base/Boton';

export default function HomePageContent() {
  const router = useRouter(); 

  return (
  <div className="px-4 py-6 bg-gray-50 min-h-screen">
    <div className="max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
  */
 
        
        {/* Columna principal (trabajos) */}
 /*       <div className="space-y-6 order-1 md:order-1">
          <div>
            <BaseButton onClick={() => router.push('/ordenes-trabajo/nueva')}>
              Nuevo trabajo
            </BaseButton>
          </div>

          <TrabajoCard />

          <BaseButton onClick={() => router.push('/archivadas')}>
            Archivados
          </BaseButton>
        </div>
*/
        {/* Columna secundaria (menú de entidades) */}
 /*       <div className="order-2 md:order-2">
          <EntidadMenu />
        </div>

      </div>
    </div>
  </div>
);
}
*/



import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';
import { useRouter } from 'next/navigation';
import AccionBoton from '../base/Boton';

export default function HomePageContent() {
  const router = useRouter();

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

          {/* Columna derecha (menú de entidades) */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <EntidadMenu />
          </div>
        </div>
      </div>
    </div>
  );
}



