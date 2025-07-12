'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface RegistroDeTrabajo {
  id: number;
  fecha: string;
  horas: number;
  ordenId: number;
  solicitud: string;
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
  fechaBaja: string;
  horasTrabajadas: number;
}

export default function EmpleadoRegistrosPage() {
  const params = useParams();
  const rawId = params.id;
  const empleadoId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [empleado, setEmpleado] = useState<EmpleadoDetalle | null>(null);
  const [registros, setRegistros] = useState<RegistroDeTrabajo[]>([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    if (!empleadoId) return;

    const fetchEmpleado = async () => {
      try {
        const res = await fetch(`http://localhost:3001/personal/${empleadoId}`);
        if (!res.ok) throw new Error('No se pudo cargar el empleado');
        const data = await res.json();
        setEmpleado(data);
      } catch (err) {
        console.error(err);
        alert('Error al cargar los datos del empleado');
      }
    };

    fetchEmpleado();
  }, [empleadoId]);

  const cargarRegistros = async () => {
    if (!empleadoId) return;
    const query = [];
    if (desde) query.push(`desde=${desde}`);
    if (hasta) query.push(`hasta=${hasta}`);
    const url = `http://localhost:3001/personal/${empleadoId}/registros-trabajo` + (query.length ? `?${query.join('&')}` : '');
    const res = await fetch(url);
    const data = await res.json();
    setRegistros(data);
  };

  const totalHoras = registros.reduce((sum, r) => sum + r.horas, 0);

  return (
    <div className="p-4 space-y-6">
      {empleado && (
        <div className="border p-4 rounded shadow bg-white">
          <h1 className="text-2xl font-bold">{empleado.nombre} {empleado.apellido}</h1>
          <p className="text-sm text-gray-600">
            {empleado.esCertificador ? '✅ Certificador' : ''} {empleado.esTecnico ? '✅ Técnico' : ''}
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p><strong>Teléfono:</strong> {empleado.telefono}</p>
            <p><strong>Email:</strong> {empleado.email}</p>
            <p><strong>Dirección:</strong> {empleado.direccion}</p>
            <p><strong>Licencia:</strong> {empleado.tipoLicencia} - {empleado.numeroLicencia}</p>
            <p><strong>Vencimiento:</strong> {empleado.vencimientoLicencia?.slice(0, 10)}</p>
            <p><strong>Fecha de alta:</strong> {empleado.fechaAlta?.slice(0, 10)}</p>
            <p><strong>Fecha de baja:</strong> {empleado.fechaBaja?.slice(0, 10)}</p>
          </div>
        </div>
      )}

      <div className="border p-4 rounded shadow bg-white">
        <h2 className="text-xl font-semibold mb-2">Registros de trabajo</h2>

        <div className="flex gap-4 items-end mb-4">
          <div>
            <label className="block text-sm">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input" />
          </div>
          <button onClick={cargarRegistros} className="btn-primary">Filtrar</button>
        </div>

        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Fecha</th>
              <th className="border px-2 py-1">Horas</th>
              <th className="border px-2 py-1">Orden ID</th>
              <th className="border px-2 py-1">Solicitud</th>
            </tr>
          </thead>
          <tbody>
            {registros.map(r => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.fecha.slice(0, 10)}</td>
                <td className="border px-2 py-1">{r.horas}</td>
                <td className="border px-2 py-1">{r.ordenId}</td>
                <td className="border px-2 py-1">{r.solicitud}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 font-semibold">Total de horas: {totalHoras}</p>
      </div>
    </div>
  );
}
