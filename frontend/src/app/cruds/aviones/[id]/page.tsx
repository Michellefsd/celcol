'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AsignarAvionComponente from '@/components/Asignaciones/AsignarAvionComponentes';
import EditarAvionComponente from '@/components/Asignaciones/EditarAvionComponente';
import AccionBoton from '@/components/base/Boton';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api } from '@/services/api'; 

interface Propietario {
  id: number;
  tipo: 'PERSONA' | 'ORGANIZACION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
}

interface ComponenteAvion {
  id: number;
  tipo: 'MOTOR' | 'HELICE' | 'INSTRUMENTO' | string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  estado: 'ACTIVO' | 'MANTENIMIENTO' | 'DESINSTALADO';
  TSN?: number | null;
  TSO?: number | null;
  TBOFecha?: string | null;
  TBOHoras?: number | null;
}

interface Avion {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie?: string | null; 
  matricula: string;
  TSN: number | null;
  vencimientoMatricula?: string | null; 
  vencimientoSeguro?: string | null;    
  certificadoMatricula?: string | null; 
  propietarios: { propietario: Propietario }[];
  componentes: ComponenteAvion[];
}

export default function AvionDetallePage() {
  const { id } = useParams();
  const [avion, setAvion] = useState<Avion | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAgregarComponente, setMostrarAgregarComponente] = useState(false);
  const [mostrarEditarComponente, setMostrarEditarComponente] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<ComponenteAvion | null>(null);
  const [mostrarSubirCertificado, setMostrarSubirCertificado] = useState(false);

  const cargarAvion = async () => {
    const res = await fetch(api(`/aviones/${id}`));
    const data = await res.json();
    setAvion(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) cargarAvion();
  }, [id]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!avion) return <div className="p-4">Avión no encontrado</div>;

  const esVisualizableEnNavegador = (url: string): boolean => {
  const extension = url.split('.').pop()?.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
};


  return (
    <div className="p-6 space-y-8">
      {/* CARD de presentación */}
      <div className="border p-4 rounded shadow bg-white">
        <h1 className="text-2xl font-bold mb-2">{avion.matricula}</h1>
        <div className="text-sm space-y-1">
          <p><strong>Marca:</strong> {avion.marca}</p>
          <p><strong>Modelo:</strong> {avion.modelo}</p>
          {avion.numeroSerie && <p><strong>N° Serie:</strong> {avion.numeroSerie}</p>}
          {avion.TSN != null && <p><strong>TSN:</strong> {avion.TSN}</p>}
          {avion.vencimientoMatricula && <p><strong>Vto. Matrícula:</strong> {avion.vencimientoMatricula.slice(0, 10)}</p>}
          {avion.vencimientoSeguro && <p><strong>Vto. Seguro:</strong> {avion.vencimientoSeguro.slice(0, 10)}</p>}
        </div>

        {avion.certificadoMatricula ? (
          <div className="pt-4 space-y-2">
            <h2 className="font-semibold">Certificado de matrícula</h2>

           <div className="flex flex-wrap gap-4 mt-2">
  {esVisualizableEnNavegador(avion.certificadoMatricula) && (
    <a
      href={api(`/${avion.certificadoMatricula}`)}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-100 text-blue-600 px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-200 transition"
    >
      Ver certificado
    </a>
  )}

  <a
    href={`/${avion.certificadoMatricula}`}
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

      {/* COMPONENTES DEL AVIÓN */}
<section>
  <div className="flex justify-between items-center">
    <h2 className="text-xl font-semibold">Componentes del Avión</h2>
    <button
      className="bg-blue-600 text-white px-3 py-1 rounded"
      onClick={() => setMostrarAgregarComponente(true)}
    >
      Agregar componente
    </button>
  </div>

  {avion.componentes?.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {avion.componentes.map((c) => (
        <div key={c.id} className="flex justify-between items-start bg-gray-100 px-4 py-3 rounded">
          <div className="text-sm grid grid-cols-2 gap-x-6 gap-y-1">
            <p><strong>Tipo:</strong> {c.tipo ?? '—'}</p>
            <p><strong>Estado:</strong> {c.estado}</p>
            <p><strong>Marca:</strong> {c.marca}</p>
            <p><strong>Modelo:</strong> {c.modelo}</p>
            <p><strong>N° Serie:</strong> {c.numeroSerie}</p>
            <p><strong>TSN:</strong> {c.TSN ?? '—'}</p>
            <p><strong>TSO:</strong> {c.TSO ?? '—'}</p>
            <p><strong>TBO (Horas):</strong> {c.TBOHoras ?? '—'}</p>
            <p><strong>TBO (Fecha):</strong> {c.TBOFecha ? c.TBOFecha.slice(0, 10) : '—'}</p>
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
                const confirmar = confirm(`¿Eliminar el componente "${c.tipo} ${c.marca} ${c.modelo}"?`);
                if (!confirmar) return;
                await fetch(api(`/componentes-avion/${c.id}`), { method: 'DELETE' });
                cargarAvion();
              }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="mt-2">No hay componentes asignados</p>
  )}
</section>


      {/* MODALES */}
      {mostrarAgregarComponente && (
        <AsignarAvionComponente
          avionId={parseInt(id as string)}
          onClose={() => setMostrarAgregarComponente(false)}
          onSaved={cargarAvion}
        />
      )}

      {mostrarEditarComponente && componenteSeleccionado && (
        <EditarAvionComponente
          componente={componenteSeleccionado}
          onClose={() => setMostrarEditarComponente(false)}
          onSaved={cargarAvion}
        />
      )}

      <SubirArchivo
        open={mostrarSubirCertificado}
        onClose={() => setMostrarSubirCertificado(false)}
        url={api(`/aviones/${avion.id}/certificadoMatricula`)}
        label="Subir certificado de matrícula"
        nombreCampo="certificadoMatricula"
        onUploaded={cargarAvion}
      />
    </div>
  );
}
