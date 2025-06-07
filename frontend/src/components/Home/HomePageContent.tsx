'use client';

import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';

export default function HomePageContent() {
  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Columna izquierda */}
      <div className="space-y-6">
        <div>
          <BaseButton onClick={() => alert('Crear nuevo trabajo')}>
            Nuevo trabajo
          </BaseButton>
          <br></br>
          <br></br>
        </div>
        <TrabajoCard />
      </div>

      {/* Columna derecha */}
      <EntidadMenu />
    </div>
  );
}
