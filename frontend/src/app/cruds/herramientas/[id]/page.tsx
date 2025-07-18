/*'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EditarHerramientaModal from '@/components/Asignaciones/EditarHerramientas';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo'; // ya lo usás en stock


interface Herramienta {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
}

export default function DetalleHerramientaPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [editando, setEditando] = useState(false);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  const cargarDatos = async () => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:3001/herramientas/${id}`);
      if (!res.ok) throw new Error('No se pudo cargar la herramienta');
      const data = await res.json();
      setHerramienta(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  if (!herramienta) return <p className="text-gray-500">Cargando herramienta...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{herramienta.nombre}</h1>
          <button
            onClick={() => setEditando(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Editar herramienta
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {herramienta.tipo && <p><strong>Tipo:</strong> {herramienta.tipo}</p>}
          {herramienta.marca && <p><strong>Marca:</strong> {herramienta.marca}</p>}
          {herramienta.modelo && <p><strong>Modelo:</strong> {herramienta.modelo}</p>}
          {herramienta.numeroSerie && <p><strong>N° Serie:</strong> {herramienta.numeroSerie}</p>}
          {herramienta.fechaIngreso && (
            <p><strong>Fecha ingreso:</strong> {new Date(herramienta.fechaIngreso).toLocaleDateString()}</p>
          )}
          {herramienta.fechaVencimiento && (
            <p><strong>Vencimiento:</strong> {new Date(herramienta.fechaVencimiento).toLocaleDateString()}</p>
          )}
        </div>

       {herramienta.certificadoCalibracion && (
  <div className="pt-4">
    <h2 className="font-semibold mb-2">Certificado de calibración</h2>
    <div className="flex flex-wrap gap-4">
      <a
        href={herramienta.certificadoCalibracion}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
      >
        Descargar certificado
      </a>
      <button
        onClick={() => setMostrarSubirCertificado(true)}
        className="text-sm text-blue-600 underline"
      >
        Reemplazar certificado
      </button>
    </div>
  </div>
)}

{!herramienta.certificadoCalibracion && (
  <div className="pt-4">
    <button
      onClick={() => setMostrarSubirCertificado(true)}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
    >
      Subir certificado
    </button>
  </div>
)}

      </div>

      {herramienta && (
        <EditarHerramientaModal
          herramienta={herramienta}
          open={editando}
          onClose={() => setEditando(false)}
          onSaved={() => {
            setEditando(false);
            cargarDatos(); // recargar herramienta actualizada
          }}
        />
        
      )}
      <SubirArchivo
  open={mostrarSubirCertificado}
  onClose={() => setMostrarSubirCertificado(false)}
  url={`http://localhost:3001/uploads/${herramienta.id}/certificadoCalibracion`}
  label="Subir certificado de calibración"
  nombreCampo="archivo"
  onUploaded={() => cargarDatos()}
/>

    </div>
  );
}
*/






'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';

interface Herramienta {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
}

export default function DetalleHerramientaPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const [item, setItem] = useState<Herramienta | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:3001/herramientas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('🔧 Herramienta cargada:', data);
        setItem({
          ...data,
          certificadoCalibracion: data.certificadoCalibracion, // ya viene con URL completa
        });
      })
      .catch((err) => console.error('Error al cargar la herramienta:', err));
  }, [id]);

  if (!item) return <p className="text-gray-500">Cargando herramienta...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
        <h1 className="text-2xl font-bold">{item.nombre}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {item.tipo && <p><strong>Tipo:</strong> {item.tipo}</p>}
          {item.marca && <p><strong>Marca:</strong> {item.marca}</p>}
          {item.modelo && <p><strong>Modelo:</strong> {item.modelo}</p>}
          {item.numeroSerie && <p><strong>N° Serie:</strong> {item.numeroSerie}</p>}
          {item.fechaIngreso && (
            <p><strong>Fecha ingreso:</strong> {new Date(item.fechaIngreso).toLocaleDateString()}</p>
          )}
          {item.fechaVencimiento && (
            <p><strong>Vencimiento:</strong> {new Date(item.fechaVencimiento).toLocaleDateString()}</p>
          )}
        </div>

        {item.certificadoCalibracion && (
          <div className="pt-4 space-y-2">
            <h2 className="font-semibold">Certificado de calibración</h2>

            <div className="flex flex-wrap gap-4 mt-2">
              <a
                href={item.certificadoCalibracion}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 text-blue-600 px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-200 transition"
              >
                Ver certificado
              </a>

              <a
                href={item.certificadoCalibracion}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Descargar certificado
              </a>

              <button
                onClick={() => setMostrarSubirCertificado(true)}
                className="text-sm text-blue-600 underline"
              >
                Reemplazar certificado
              </button>
            </div>
          </div>
        )}

        {!item.certificadoCalibracion && (
          <div className="pt-4">
            <button
              onClick={() => setMostrarSubirCertificado(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Subir certificado
            </button>
          </div>
        )}
      </div>

      <SubirArchivo
        open={mostrarSubirCertificado}
        onClose={() => setMostrarSubirCertificado(false)}
        url={`http://localhost:3001/herramientas/${item.id}/certificadoCalibracion`}
        label="Subir certificado de calibración"
        nombreCampo="archivo"
        onUploaded={() => {
          fetch(`http://localhost:3001/herramientas/${item.id}`)
            .then((res) => res.json())
            .then((data) => setItem(data));
        }}
      />
    </div>
  );
}

