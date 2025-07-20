'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AgregarComponenteModal from '@/components/Asignaciones/AsignarComponente';
import EditarComponenteModal from '@/components/Asignaciones/EditarComponente';
import AccionBoton from '@/components/base/Boton';
import { api } from '@/services/api'; 

interface Avion {
  id: number;
  marca: string;
  modelo: string;
  matricula: string;
}

interface ComponenteExterno {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  numeroParte?: string;
  TSN?: number;
  TSO?: number;
  TBOFecha?: string;
  TBOHoras?: number;
  archivo8130?: string;
}

interface Propietario {
  id: number;
  tipoPropietario: 'PERSONA' | 'INSTITUCION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
  rut?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
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
    const res = await fetch(api(`/propietarios/${id}`));
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

  return (
    <div className="p-6 space-y-8">
      {/* CARD de presentación */}
      <div className="border p-4 rounded shadow bg-white">
        <h1 className="text-2xl font-bold mb-1">
          {propietario.tipoPropietario === 'INSTITUCION'
            ? propietario.nombreEmpresa || '—'
            : `${propietario.nombre ?? ''} ${propietario.apellido ?? ''}`.trim() || '—'}
        </h1>

        {propietario.tipoPropietario === 'INSTITUCION' && propietario.rut && (
          <p className="text-sm text-gray-600 mb-2">RUT: {propietario.rut}</p>
        )}

        <div className="text-sm space-y-1">
          <p><strong>Tipo:</strong> {propietario.tipoPropietario === 'INSTITUCION' ? 'Institución' : 'Persona'}</p>
          {propietario.telefono && <p><strong>Teléfono:</strong> {propietario.telefono}</p>}
          {propietario.email && <p><strong>Email:</strong> {propietario.email}</p>}
          {propietario.direccion && <p><strong>Dirección:</strong> {propietario.direccion}</p>}
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {componentes.map((c) => (
              <div key={c.id} className="flex justify-between items-start bg-gray-100 px-4 py-3 rounded">
                <div className="text-sm grid grid-cols-2 gap-x-6 gap-y-1">
                  <p><strong>Tipo:</strong> {c.tipo ?? '—'}</p>
                  <p><strong>Marca:</strong> {c.marca}</p>
                  <p><strong>Modelo:</strong> {c.modelo}</p>
                  <p><strong>N° Serie:</strong> {c.numeroSerie}</p>
                  {c.numeroParte && <p><strong>N° Parte:</strong> {c.numeroParte}</p>}
                  <p><strong>TSN:</strong> {c.TSN ?? '—'}</p>
                  <p><strong>TSO:</strong> {c.TSO ?? '—'}</p>
                  <p><strong>TBO (Horas):</strong> {c.TBOHoras ?? '—'}</p>
                  <p><strong>TBO (Fecha):</strong> {c.TBOFecha ? c.TBOFecha.slice(0, 10) : '—'}</p>
                  {c.archivo8130 && (
                    <p className="col-span-2">
                      <strong>8130:</strong>{' '}
                      <a
                        href={`/${c.archivo8130}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Ver archivo
                      </a>
                    </p>
                  )}
                </div>
                <div className="space-x-2 ml-4 mt-2">
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
                      await fetch(`/componentes/${c.id}`, { method: 'DELETE' });
                      cargarPropietario();
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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
