'use client';

import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';
import { useRouter } from 'next/navigation'; 

export default function HomePageContent() {
  const router = useRouter(); 

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Columna izquierda */}
      <div className="space-y-6">
        <div>
          <BaseButton onClick={() => router.push('/ordenes-trabajo/nueva')}>
            Nuevo trabajo
          </BaseButton>
          <br />
          <br />
        </div>
        <TrabajoCard />
         <BaseButton onClick={() => router.push('/archivadas')}>
            Archivados
        </BaseButton>
      </div>

      {/* Columna derecha */}
      <EntidadMenu />
    </div>
  );
}
