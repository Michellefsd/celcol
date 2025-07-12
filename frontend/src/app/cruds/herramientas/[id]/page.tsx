'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  const router = useRouter();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError('ID inválido');
      return;
    }

    fetch(`http://localhost:3001/herramientas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => setHerramienta(data))
      .catch((err) => {
        console.error('Error al cargar herramienta:', err);
        setError('No se pudo cargar la herramienta.');
      });
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!herramienta) return <p className="text-gray-500">Cargando herramienta...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
        <h1 className="text-2xl font-bold">{herramienta.nombre}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {herramienta.tipo && <p><strong>Tipo:</strong> {herramienta.tipo}</p>}
          {herramienta.marca && <p><strong>Marca:</strong> {herramienta.marca}</p>}
          {herramienta.modelo && <p><strong>Modelo:</strong> {herramienta.modelo}</p>}
          {herramienta.numeroSerie && <p><strong>N° Serie:</strong> {herramienta.numeroSerie}</p>}
          {herramienta.fechaIngreso && (
            <p><strong>Fecha de ingreso:</strong> {new Date(herramienta.fechaIngreso).toLocaleDateString()}</p>
          )}
          {herramienta.fechaVencimiento && (
            <p><strong>Fecha de vencimiento:</strong> {new Date(herramienta.fechaVencimiento).toLocaleDateString()}</p>
          )}
        </div>

        {herramienta.certificadoCalibracion && (
          <div className="pt-4">
            <h2 className="font-semibold mb-2">Certificado de calibración</h2>
            <a
              href={herramienta.certificadoCalibracion}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Ver certificado
            </a>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={() => router.push(`/herramientas/${herramienta.id}/editar`)}
            className="btn-primary"
          >
            Editar herramienta
          </button>
        </div>
      </div>
    </div>
  );
}
