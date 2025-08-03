'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseCard from '../BaseCard';
import BaseHeading from '../BaseHeading';
import { api } from '@/services/api';

type OrdenTrabajo = {
  id: number;
  fechaApertura: string | null;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  archivada?: boolean;
  avion?: { matricula: string };
  componente?: { tipo: string; marca: string; modelo: string };
};

export default function TrabajoCard() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(api('/ordenes-trabajo'))
      .then(res => res.json())
      .then(setOrdenes)
      .catch((err) => console.error('Error al cargar órdenes:', err));
  }, []);

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

const eliminarOrden = async (id: number) => {
  const confirmar = confirm(`¿Estás segura de que querés eliminar la orden #${id}?`);
  if (!confirmar) return;

  try {
    const res = await fetch(api(`/ordenes-trabajo/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar');
    setOrdenes((prev) => prev.filter((o) => o.id !== id));
  } catch (error) {
    alert('No se pudo eliminar la orden');
    console.error(error);
  }

  const ordenesFiltradas = ordenes
    .filter((orden) => !orden.archivada)
    .filter((orden) => {
      const texto = busqueda.toLowerCase();
      const avionTexto = orden.avion?.matricula?.toLowerCase() ?? '';
      const compTexto = `${orden.componente?.tipo ?? ''} ${orden.componente?.marca ?? ''} ${orden.componente?.modelo ?? ''}`.toLowerCase();
      return (
        avionTexto.includes(texto) ||
        compTexto.includes(texto) ||
        orden.id.toString().includes(texto)
      );
    });
};


const ordenesFiltradas = ordenes
  .filter((orden) => !orden.archivada) // ⬅️ oculta archivadas
  .filter((orden) => {
    const texto = busqueda.toLowerCase();
    const avionTexto = orden.avion?.matricula?.toLowerCase() ?? '';
    const compTexto = `${orden.componente?.tipo ?? ''} ${orden.componente?.marca ?? ''} ${orden.componente?.modelo ?? ''}`.toLowerCase();
    return (
      avionTexto.includes(texto) ||
      compTexto.includes(texto) ||
      orden.id.toString().includes(texto)
    );
  });


  return (
    <BaseCard>
      <BaseHeading>Trabajos realizados</BaseHeading>

      <input
        type="text"
        placeholder="Buscar por matrícula, tipo o ID..."
        className="w-full border px-3 py-2 mb-4 rounded"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {ordenesFiltradas.length === 0 ? (
        <div className="text-gray-500 italic">No se encontraron trabajos.</div>
      ) : (
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {ordenesFiltradas.map((orden) => (
            <li key={orden.id} className="py-2 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor: {
                        ABIERTA: '#16a34a',   // verde
                        CERRADA: '#dc2626',   // rojo
                        CANCELADA: '#9ca3af', // gris
                      }[orden.estadoOrden],
                    }}
                    title={orden.estadoOrden}
                  ></span>
                  #{orden.id}{' '}
                  {orden.avion
                    ? `– Avión ${orden.avion.matricula}`
                    : orden.componente
                    ? `– ${orden.componente.tipo} (${orden.componente.marca} ${orden.componente.modelo})`
                    : ''}
                </p>
                <p className="text-xs text-gray-500">{formatearFecha(orden.fechaApertura)}</p>
              </div>

              

              <div className="flex items-center gap-2">
                {['CERRADA', 'CANCELADA'].includes(orden.estadoOrden) && (
  <button
    onClick={async () => {
      const confirmar = confirm(`¿Querés archivar la orden #${orden.id}?`);
      if (!confirmar) return;

      try {
        const res = await fetch(api(`/ordenes-trabajo/${orden.id}/archivar`), {
          method: 'PUT',
        });
        if (!res.ok) throw new Error('Error al archivar');

        setOrdenes((prev) =>
          prev.map((o) =>
            o.id === orden.id ? { ...o, archivada: true } : o
          )
        );
        alert(`Orden #${orden.id} archivada con éxito.`);
      } catch (err) {
        console.error(err);
        alert('No se pudo archivar la orden.');
      }
    }}
    title="Archivar orden"
    className="text-yellow-600 hover:text-yellow-800 text-sm"
  >
    🗃
  </button>
)}
{!['CERRADA', 'CANCELADA'].includes(orden.estadoOrden) && (
  <button
    onClick={() =>
      alert('No se pueden archivar órdenes de trabajo abiertas.')
    }
    title="Solo se pueden archivar órdenes cerradas o canceladas"
    className="text-gray-400 cursor-not-allowed text-sm"
  >
    🗃
  </button>
)}

                <button
                  onClick={() =>
router.push(
  orden.estadoOrden === 'ABIERTA'
    ? `/ordenes-trabajo/${orden.id}/fase3`
    : orden.estadoOrden === 'CERRADA'
    ? `/ordenes-trabajo/${orden.id}/cerrada`
    : `/ordenes-trabajo/${orden.id}/cancelada`
)

                  }
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title="Ver orden"
                >
                  👁
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BaseCard>
  );
}
