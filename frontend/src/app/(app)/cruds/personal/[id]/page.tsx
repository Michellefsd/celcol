'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api, fetchJson } from '@/services/api';
import VolverAtras from '@/components/Arrow';

interface RegistroDeTrabajo {
  id: number;
  fecha: string;
  horas: number;
  ordenId: number;
  solicitud: string;
  rol: 'TECNICO' | 'CERTIFICADOR' | 'NO_ESPECIFICADO';
  trabajoRealizado?: string | null;   // <- NUEVO
}


interface EmpleadoDetalle {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  esCertificador: boolean;
  esTecnico: boolean;
  direccion: string;
  tipoLicencia: string;
  numeroLicencia: string;
  vencimientoLicencia: string;
  fechaAlta: string;
  horasTrabajadas: number;
  carneSalud?: string; 
}

export default function EmpleadoRegistrosPage() {
  const params = useParams();
  const rawId = params.id;
  const empleadoId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [empleado, setEmpleado] = useState<EmpleadoDetalle | null>(null);
  const [registros, setRegistros] = useState<RegistroDeTrabajo[]>([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [mostrarSubirCarne, setMostrarSubirCarne] = useState(false);

 const fetchEmpleado = async () => {
    if (!empleadoId) return;
    try {
      const data = await fetchJson<EmpleadoDetalle>(`/personal/${empleadoId}`);
       setEmpleado(data);
    } catch (err) {
      console.error(err);
      alert('Error al cargar los datos del empleado');
    }
  };

  useEffect(() => {
    fetchEmpleado();
  }, [empleadoId]);

const cargarRegistros = async () => {
  if (!empleadoId) return;

  const query: string[] = [];
  if (desde) query.push(`desde=${desde}`);
  if (hasta) query.push(`hasta=${hasta}`);

  const url = api(
    `/personal/${empleadoId}/registros-trabajo${query.length ? `?${query.join('&')}` : ''}`
  );

  try {
    const res = await fetch(url, {
      credentials: 'include',               // 👈 manda cookies
      headers: { Accept: 'application/json' } // 👈 sin Content-Type en GET
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setRegistros(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('❌ Error al filtrar registros:', err);
  }
};


  const totalHoras = registros.reduce((sum, r) => sum + r.horas, 0);

    const esVisualizableEnNavegador = (url: string): boolean => {
  const extension = url.split('.').pop()?.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
};

const urlCarne = empleado?.carneSalud?.startsWith('http')
  ? empleado.carneSalud
  : empleado?.carneSalud
  ? api(`/${empleado.carneSalud}`)
  : '';


useEffect(() => {
  if (!empleadoId) return;

  // Calcular fechas: desde hace 7 días hasta hoy
  const hoy = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(hoy.getDate() - 7);

  const formato = (d: Date) => d.toISOString().slice(0, 10);
  const desdeStr = formato(hace7Dias);
  const hastaStr = formato(hoy);

  setDesde(desdeStr);
  setHasta(hastaStr);

  // Cargar registros automáticamente
  const cargar = async () => {
    const data = await fetchJson<RegistroDeTrabajo[]>(
      `/personal/${empleadoId}/registros-trabajo?desde=${desdeStr}&hasta=${hastaStr}`
    );
    setRegistros(data);
  };

  cargar();
}, [empleadoId]);



  return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <VolverAtras texto="Volver a la lista de empleados" />
      
      <h1 className="text-2xl font-semibold text-slate-900">Detalles del empleado</h1>

      {empleado && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">{empleado.nombre} {empleado.apellido}</h2>
          {/* Habilitaciones del empleado */}
<div className="flex flex-wrap items-center gap-2 text-sm">
  {empleado.esTecnico && (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 border-emerald-300 text-emerald-700">
      TÉCNICO habilitado
    </span>
  )}
  {empleado.esCertificador && (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 border-indigo-300 text-indigo-700">
      CERTIFICADOR habilitado
    </span>
  )}
  {!empleado.esTecnico && !empleado.esCertificador && (
    <span className="text-slate-500">Sin habilitaciones registradas</span>
  )}
</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <p><span className="text-slate-500">Teléfono:</span> {empleado.telefono}</p>
            <p><span className="text-slate-500">Email:</span> {empleado.email}</p>
            <p><span className="text-slate-500">Dirección:</span> {empleado.direccion}</p>
            <p><span className="text-slate-500">Licencia:</span> {empleado.tipoLicencia} - {empleado.numeroLicencia}</p>
            <p><span className="text-slate-500">Fecha de alta:</span> {empleado.fechaAlta?.slice(0, 10)}</p>
            <p><span className="text-slate-500">Vencimiento:</span> {empleado.vencimientoLicencia?.slice(0, 10)}</p>
          </div>

          {/* Carné de salud */}
          
          <div className="pt-4">
            {empleado.carneSalud ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Carné de salud</h3>
                <div className="flex flex-wrap gap-3">
                 {esVisualizableEnNavegador(urlCarne) && (
                    <a
href={urlCarne}

                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    >
                      👁️ Ver carné
                    </a>
                  )}
                  <a
                    href={urlCarne}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    Descargar
                  </a>
                  <button
                    type="button"
                    onClick={() => setMostrarSubirCarne(true)}
                    className="text-sm text-cyan-600 underline underline-offset-2 hover:text-cyan-800"
                  >
                    Reemplazar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarSubirCarne(true)}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
              >
                Subir carné de salud
              </button>
            )}
          </div>

          <SubirArchivo
            open={mostrarSubirCarne}
            onClose={() => setMostrarSubirCarne(false)}
            url={api(`/personal/${empleado.id}/carneSalud`)}
            label="Subir carné de salud"
            nombreCampo="carneSalud"
            onUploaded={fetchEmpleado}
          />
        </section>
      )}

      {/* Registros de trabajo */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Registros de trabajo</h2>

        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div>
            <label className="block text-sm text-slate-500">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm text-slate-500">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input" />
          </div>
          <button
            type="button"
            onClick={cargarRegistros}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
          >
            Filtrar
          </button>
        </div>
<div className="overflow-x-auto">
  <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
    <thead>
      <tr className="bg-slate-50 text-slate-600">
        <th className="border px-2 py-1">Fecha</th>
        <th className="border px-2 py-1">Horas</th>
        <th className="border px-2 py-1">Orden ID</th>
        <th className="border px-2 py-1">Solicitud</th>
        <th className="border px-2 py-1">Rol</th>
        <th className="border px-2 py-1">Trabajo realizado</th>
      </tr>
    </thead>
    <tbody>
      {registros.length === 0 ? (
        <tr>
          <td className="border px-2 py-3 text-center text-slate-500" colSpan={6}>
            Sin registros en el rango seleccionado
          </td>
        </tr>
      ) : (
        registros.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50">
            <td className="border px-2 py-1">{r.fecha.slice(0, 10)}</td>
            <td className="border px-2 py-1">{r.horas}</td>
            <td className="border px-2 py-1">{r.ordenId}</td>
            <td className="border px-2 py-1">{r.solicitud}</td>
            <td className="border px-2 py-1">{r.rol}</td>
            <td className="border px-2 py-1">
              <div
                className="max-w-[520px] whitespace-pre-wrap break-words"
                title={r.trabajoRealizado || ''}
              >
                {r.trabajoRealizado || '—'}
              </div>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

        <p className="mt-4 font-semibold">Total de horas: {totalHoras}</p>

        <button
          type="button"
          onClick={() => {
            const url = api(`/personal/${empleadoId}/registros-trabajo/pdf?desde=${desde}&hasta=${hasta}`);
            window.open(url, '_blank');
          }}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-5 py-2.5 shadow-sm hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
        >
          Descargar PDF
        </button>
      </section>
    </main>
  </div>
);

}
