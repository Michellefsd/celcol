'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AgregarMotorModal from '@/components/Asignaciones/AsignarMotores';
import AgregarHeliceModal from '@/components/Asignaciones/AsignarHelices';
import AccionBoton from '@/components/base/Boton';
import EditarMotorModal from '@/components/Asignaciones/EditarMotorModal';
import EditarHeliceModal from '@/components/Asignaciones/EditarHeliceModal';


interface Propietario {
  id: number;
  tipo: 'PERSONA' | 'ORGANIZACION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
}

interface Motor {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie: string;
}

interface Helice {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie: string;
}

interface Avion {
  id: number;
  marca: string;
  modelo: string;
  matricula: string;
  horasDesdeNuevo: number | null;
  propietarios: { propietario: Propietario }[];
  motores: Motor[];
  helices: Helice[];
}

export default function AvionDetallePage() {
  const { id } = useParams();
  const [avion, setAvion] = useState<Avion | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAgregarMotor, setMostrarAgregarMotor] = useState(false);
  const [mostrarAgregarHelice, setMostrarAgregarHelice] = useState(false);
  const [motorSeleccionado, setMotorSeleccionado] = useState<Motor | null>(null);
  const [mostrarEditarMotor, setMostrarEditarMotor] = useState(false);
  const [heliceSeleccionada, setHeliceSeleccionada] = useState<Helice | null>(null);
  const [mostrarEditarHelice, setMostrarEditarHelice] = useState(false);

  const cargarAvion = async () => {
    const res = await fetch(`http://localhost:3001/aviones/${id}`);
    const data = await res.json();
    setAvion(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) cargarAvion();
  }, [id]);

  
  if (loading) return <div className="p-4">Cargando...</div>;
  if (!avion) return <div className="p-4">Avión no encontrado</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Detalle de Avión</h1>

      {/* DATOS GENERALES */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Datos generales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Marca:</strong> {avion.marca}</div>
          <div><strong>Modelo:</strong> {avion.modelo}</div>
          <div><strong>Matrícula:</strong> {avion.matricula}</div>
          <div><strong>Horas desde nuevo:</strong> {avion.horasDesdeNuevo ?? '—'}</div>
        </div>
      </section>

      {/* PROPIETARIOS */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Propietarios</h2>
        {avion.propietarios?.length > 0 ? (
          <ul className="list-disc ml-6">
            {avion.propietarios.map(({ propietario }) => {
              const nombre = propietario.tipo === 'ORGANIZACION'
                ? propietario.nombreEmpresa
                : `${propietario.nombre} ${propietario.apellido}`;
              return <li key={propietario.id}>{nombre}</li>;
            })}
          </ul>
        ) : <p>No hay propietarios asignados</p>}
      </section>

      {/* MOTORES */}
      <section>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Motores</h2>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => setMostrarAgregarMotor(true)}
          >
            Agregar motor
          </button>
        </div>
        {avion.motores.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {avion.motores.map((m) => (
              <li key={m.id} className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded">
                <span>{m.marca} {m.modelo} — Nº Serie: {m.numeroSerie}</span>
                <div className="space-x-2">
                  <AccionBoton
                    label="Editar"
                    color="blue"
                    onClick={() => {
                        setMotorSeleccionado(m);
                        setMostrarEditarMotor(true);
                    }}
                  />
                  
                 <AccionBoton
                  label="Eliminar"
                  color="red"
                  onClick={async () => {
                    const confirmar = confirm(`¿Estás seguro de que querés eliminar el motor "${m.marca} ${m.modelo}"?`);
                    if (!confirmar) return;
                    await fetch(`http://localhost:3001/motores/${m.id}`, { method: 'DELETE' });
                    cargarAvion();
                  }}
                />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2">No hay motores asignados</p>}
      </section>
      {mostrarEditarMotor && motorSeleccionado && (
        <EditarMotorModal
          motor={motorSeleccionado}
          onClose={() => setMostrarEditarMotor(false)}
          onSaved={cargarAvion}
        />
      )}

      {/* HÉLICES */}
      <section>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Hélices</h2>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => setMostrarAgregarHelice(true)}
          >
            Agregar hélice
          </button>
        </div>
        {avion.helices.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {avion.helices.map((h) => (
              <li key={h.id} className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded">
                <span>{h.marca} {h.modelo} — Nº Serie: {h.numeroSerie}</span>
                <div className="space-x-2">
                  <AccionBoton
                    label="Editar"
                    color="blue"
                    onClick={() => {
                        setHeliceSeleccionada(h);
                        setMostrarEditarHelice(true);
                    }}
                  />
                  {mostrarEditarHelice && heliceSeleccionada && (
                    <EditarHeliceModal
                      helice={heliceSeleccionada}
                      onClose={() => setMostrarEditarHelice(false)}
                      onSaved={cargarAvion}
                    />
                  )}
                  <AccionBoton
                    label="Eliminar"
                    color="red"
                    onClick={async () => {
                      const confirmar = confirm(`¿Estás seguro de que querés eliminar la hélice "${h.marca} ${h.modelo}"?`);
                      if (!confirmar) return;
                        await fetch(`http://localhost:3001/helices/${h.id}`, { method: 'DELETE' });
                      cargarAvion();
                    }}
                />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2">No hay hélices asignadas</p>}
      </section>

      {/* MODALES */}
      {mostrarAgregarMotor && (
        <AgregarMotorModal
          avionId={parseInt(id as string)}
          onClose={() => setMostrarAgregarMotor(false)}
          onSaved={cargarAvion}
        />
      )}
      {mostrarAgregarHelice && (
        <AgregarHeliceModal
          avionId={parseInt(id as string)}
          onClose={() => setMostrarAgregarHelice(false)}
          onSaved={cargarAvion}
        />
      )}
    </div>
  );
}
