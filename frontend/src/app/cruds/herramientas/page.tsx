// Componente base para CRUD de herramientas calibrables en el frontend
// Este archivo incluye listado, creación y edición con carga opcional de archivo 8130

'use client';

import { useEffect, useState } from 'react';
import AgregarHerramientaModal from '@/components/Asignaciones/AsignarHerramientas';
import EditarHerramientaModal from '@/components/Asignaciones/EditarHerramientas';
import AccionBoton from '@/components/base/Boton';

interface Herramienta {
  id: number;
  nombre: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
  archivo8130?: string;
}

export default function HerramientasPage() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState<Herramienta | null>(null);

  const cargarHerramientas = async () => {
    const res = await fetch('http://localhost:3001/herramientas');
    const data = await res.json();
    setHerramientas(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarHerramientas();
  }, []);

  if (loading) return <div className="p-4">Cargando herramientas...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Herramientas calibrables</h1>
        <button className="btn-primary" onClick={() => setMostrarAgregar(true)}>Agregar herramienta</button>
      </div>

      {herramientas.length === 0 ? (
        <p>No hay herramientas registradas</p>
      ) : (
        <ul className="space-y-2">
          {herramientas.map((h) => (
            <li key={h.id} className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded">
              <div>
                <p><strong>{h.nombre}</strong> — {h.marca} {h.modelo}</p>
                <p className="text-sm text-gray-600">N° Serie: {h.numeroSerie || '—'} | Vence: {h.fechaVencimiento?.slice(0, 10) || '—'}</p>
              </div>
              <div className="space-x-2">
                <AccionBoton
                  label="Editar"
                  color="blue"
                  onClick={() => {
                    setHerramientaSeleccionada(h);
                    setMostrarEditar(true);
                  }}
                />
                <AccionBoton
                  label="Eliminar"
                  color="red"
                  onClick={async () => {
                    const confirmar = confirm(`¿Eliminar herramienta "${h.nombre}"?`);
                    if (!confirmar) return;
                    await fetch(`http://localhost:3001/herramientas/${h.id}`, { method: 'DELETE' });
                    cargarHerramientas();
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {mostrarAgregar && (
        <AgregarHerramientaModal
          open={true}
          onClose={() => setMostrarAgregar(false)}
          onSaved={cargarHerramientas}
        />
      )}

      {mostrarEditar && herramientaSeleccionada && (
        <EditarHerramientaModal
          herramienta={herramientaSeleccionada}
          open={true}
          onClose={() => setMostrarEditar(false)}
          onSaved={cargarHerramientas}
        />
      )}
    </div>
  );
}
