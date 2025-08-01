'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api } from '@/services/api'; 

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
  const { id } = useParams();
  const [item, setItem] = useState<Herramienta | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  useEffect(() => {
    if (!id) return;

    const url = api(`/herramientas/${id}`);
    console.log('🔧 Cargando herramienta desde:', url);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status} al obtener herramienta`);
        return res.json();
      })
      .then((data) => {
        setItem({ ...data, certificadoCalibracion: data.certificadoCalibracion });
      })
      .catch((err) => console.error('❌ Error al cargar la herramienta:', err));
  }, [id]);

  if (!item) return <p className="text-gray-500">Cargando herramienta...</p>;

  const esVisualizableEnNavegador = (url: string): boolean => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
  };

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

        {item.certificadoCalibracion ? (
          <div className="pt-4 space-y-2">
            <h2 className="font-semibold">Certificado de calibración</h2>
            <div className="flex flex-wrap gap-4 mt-2">
              {esVisualizableEnNavegador(item.certificadoCalibracion) && (
                <a
                  href={item.certificadoCalibracion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 text-blue-600 px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-200 transition"
                >
                  Ver certificado
                </a>
              )}
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
        ) : (
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
        url={api(`/herramientas/${item.id}/certificadoCalibracion`)}
        label="Subir certificado de calibración"
        nombreCampo="certificadoCalibracion"
        onUploaded={() => {
          fetch(api(`/herramientas/${item.id}`))
            .then((res) => {
              if (!res.ok) throw new Error('No se pudo recargar herramienta');
              return res.json();
            })
            .then((data) => setItem(data))
            .catch((err) => console.error('Error al recargar:', err));
        }}
      />
    </div>
  );
}
