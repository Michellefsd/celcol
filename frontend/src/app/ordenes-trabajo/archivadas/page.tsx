'use client';

import { useEffect, useState } from 'react';
import BaseCard from '@/components/BaseCard';
import BaseHeading from '@/components/BaseHeading';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';



  type OrdenTrabajo = {
  id: number;
  archivada: boolean;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  avion?: { matricula: string };
  componente?: { tipo: string; marca: string; modelo: string };
};

export default function ArchivadasPage() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const router = useRouter();


  useEffect(() => {
    fetch(api('/ordenes-trabajo'))
      .then(res => res.json())
.then((data: OrdenTrabajo[]) => {
  const archivadas = data.filter((o) => o.archivada);
  setOrdenes(archivadas);
});
  }, []);



  return (
    <BaseCard>
      <BaseHeading>Órdenes archivadas</BaseHeading>

      {ordenes.length === 0 ? (
        <div className="text-gray-500 italic">No hay órdenes archivadas.</div>
      ) : (
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {ordenes.map((orden) => (
            <li key={orden.id} className="py-2 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">
                  #{orden.id} — {orden.avion?.matricula || orden.componente?.tipo}
                </p>
              </div>
              <button
                onClick={() =>
                  router.push(
                    orden.estadoOrden === 'CERRADA'
                      ? `/ordenes-trabajo/${orden.id}/cerrada`
                      : `/ordenes-trabajo/${orden.id}/cancelada`
                  )
                }
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                👁
              </button>
            </li>
          ))}
        </ul>
      )}
    </BaseCard>
  );
}
