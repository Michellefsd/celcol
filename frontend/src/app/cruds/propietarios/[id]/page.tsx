'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AgregarComponenteModal from '@/components/Asignaciones/AsignarComponente';
import EditarComponenteModal from '@/components/Asignaciones/EditarComponente';
import AccionBoton from '@/components/base/Boton';

interface Avion {
  id: number;
  marca: string;
  modelo: string;
  matricula: string;
}

interface ComponenteExterno {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie: string;
}

interface Propietario {
  id: number;
  tipo: 'PERSONA' | 'ORGANIZACION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
}

export default function PropietarioDetallePage() {
  const { id } = useParams();
  const [propietario, setPropietario] = useState<Propietario | null>(null);
  const [aviones, setAviones] = useState<Avion[]>([]);
  const [componentes, setComponentes] = useState<ComponenteExterno[]>([]);
  const [loading, setLoading] = useState(true);

  const [mostrarAgregarComponente, setMostrarAgregarComponente] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<ComponenteExterno | null>(null);
  const [mostrarEditarComponente, setMostrarEditarComponente] = useState(false);

  const cargarPropietario = async () => {
    const res = await fetch(`http://localhost:3001/propietarios/${id}`);
    const data = await res.json();
    setPropietario(data);
    setAviones(data.aviones || []);
    setComponentes(data.componentesExternos || []);
    setLoading(false);
  };

  useEffect(() => {
    if (id) cargarPropietario();
  }, [id]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!propietario) return <div className="p-4">Propietario no encontrado</div>;

  const nombre = propietario.tipo === 'ORGANIZACION'
    ? propietario.nombreEmpresa
    : `${propietario.nombre} ${propietario.apellido}`;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Detalle de Propietario</h1>

      {/* DATOS GENERALES */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Datos generales</h2>
        <p><strong>Tipo:</strong> {propietario.tipo}</p>
        <p><strong>Nombre:</strong> {nombre}</p>
      </section>

      {/* AVIONES ASOCIADOS */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Aviones asociados</h2>
        {aviones.length > 0 ? (
          <ul className="list-disc ml-6">
            {aviones.map((avion) => (
              <li key={avion.id}>
                <Link className="text-blue-600 underline" href={`/cruds/aviones/${avion.id}`}>
                  {avion.marca} {avion.modelo} — Matrícula: {avion.matricula}
                </Link>
              </li>
            ))}
          </ul>
        ) : <p>No hay aviones registrados</p>}
      </section>

      {/* COMPONENTES EXTERNOS */}
      <section>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Componentes externos</h2>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => setMostrarAgregarComponente(true)}
          >
            Agregar componente
          </button>
        </div>
        {componentes.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {componentes.map((c) => (
              <li key={c.id} className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded">
                <span>{c.marca} {c.modelo} — Nº Serie: {c.numeroSerie}</span>
                <div className="space-x-2">
                  <AccionBoton
                    label="Editar"
                    color="blue"
                    onClick={() => {
                      setComponenteSeleccionado(c);
                      setMostrarEditarComponente(true);
                    }}
                  />
                  <AccionBoton
                    label="Eliminar"
                    color="red"
                    onClick={async () => {
                      const confirmar = confirm(`¿Estás seguro de que querés eliminar el componente "${c.marca} ${c.modelo}"?`);
                      if (!confirmar) return;
                      await fetch(`http://localhost:3001/componentes/${c.id}`, { method: 'DELETE' });
                      cargarPropietario();
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2">No hay componentes asignados</p>}
      </section>

      {/* MODALES */}
      {mostrarAgregarComponente && (
        <AgregarComponenteModal
          propietarioId={parseInt(id as string)}
          open={true}
          onClose={() => setMostrarAgregarComponente(false)}
          onSaved={cargarPropietario}
        />
      )}

      {mostrarEditarComponente && componenteSeleccionado && (
        <EditarComponenteModal
          componente={componenteSeleccionado}
          open={true}
          onClose={() => setMostrarEditarComponente(false)}
          onSaved={cargarPropietario}
        />
      )}
    </div>
  );
}
