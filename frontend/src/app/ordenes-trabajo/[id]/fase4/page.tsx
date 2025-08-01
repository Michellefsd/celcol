'use client';


import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';

interface RegistroTrabajo {
  id?: number;
  empleadoId: number | '';
  fecha: string;
  horas: number | '';
  guardado?: boolean;
}

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
}

interface Avion {
  matricula?: string;
  marca?: string;
  modelo?: string;
}

interface Componente {
  tipo?: string;
  marca?: string;
  modelo?: string;
}

interface EmpleadoAsignado {
  empleadoId: number;
  empleado: Empleado;
  rol: 'TECNICO' | 'CERTIFICADOR';
}


interface HerramientaAsignada {
  herramientaId: number;
  herramienta: {
    nombre: string;
    marca?: string;
    modelo?: string;
  };
}

interface StockAsignado {
  stockId: number;
  cantidadUtilizada: number;
  stock: {
    nombre: string;
    marca?: string;
    modelo?: string;
  };
}

interface OrdenTrabajo {
  id: number;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  archivoFactura?: string;
  estadoFactura?: 'NO_ENVIADA' | 'ENVIADA' | 'PAGA' | '';
  numeroFactura?: string;
  registrosTrabajo?: RegistroTrabajo[];
  avion?: Avion;
  componente?: Componente;
  solicitud?: string;
  solicitadoPor?: string;
  inspeccionRecibida?: boolean;
  danosPrevios?: string;
  accionTomada?: string;
  observaciones?: string;
  empleadosAsignados?: EmpleadoAsignado[];
  herramientas?: HerramientaAsignada[];
  stockAsignado?: StockAsignado[];
}

export default function Fase4OrdenTrabajoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [estadoFactura, setEstadoFactura] = useState<OrdenTrabajo['estadoFactura']>('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [registros, setRegistros] = useState<RegistroTrabajo[]>([]);
  const [personal, setPersonal] = useState<Empleado[]>([]);
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);

  useEffect(() => {
    if (!id) return;

const fetchData = async () => {
  try {
    const res = await fetch(api(`/ordenes-trabajo/${id}`));
    const data: OrdenTrabajo = await res.json();

    // 🚫 Redirigir si está cerrada
    if (data.estadoOrden === 'CERRADA') {
      router.replace(`/ordenes-trabajo/${id}/cerrada`);
      return;
    }

    // ✅ Si no está cerrada, seguir con la carga
    setOrden(data);
    setEstadoFactura(data.estadoFactura ?? '');
    setNumeroFactura(data.numeroFactura ?? '');
    setRegistros(
      (data.registrosTrabajo ?? []).map((r) => ({
        ...r,
        guardado: true,
      }))
    );
  } catch {
    setOrden(null);
  }
};


    const fetchPersonal = async () => {
      try {
        const res = await fetch(api('/personal'));
        const data: Empleado[] = await res.json();
        setPersonal(data);
      } catch {
        setPersonal([]);
      }
    };

    fetchData();
    fetchPersonal();
  }, [id]);
// Actualizar campos de un registro (por fila)
  const updateRegistro = (index: number, campo: keyof RegistroTrabajo, valor: any) => {
    setRegistros((prev) =>
      prev.map((reg, idx) =>
        idx === index
          ? { ...reg, [campo]: valor, guardado: false }
          : reg
      )
    );
  };

  // Guardar un registro
  const guardarRegistro = async (index: number) => {
    const r = registros[index];
    if (!r.empleadoId || !r.fecha || !r.horas) {
      alert('Faltan datos en la fila');
      return;
    }

    const res = await fetch(api(`/ordenes-trabajo/${id}/registro-trabajo`), {
      method: 'POST',
      body: JSON.stringify(r),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      alert('Error al guardar registro');
      return;
    }

    const data = await res.json();
    // Asegurar el formato del registro devuelto
    setRegistros((prev) =>
      prev.map((reg, idx) =>
        idx === index ? { ...(Array.isArray(data) ? data[0] : data), guardado: true } : reg
      )
    );
  };

  // Eliminar fila local (no en backend)
  const eliminarFila = (index: number) => {
    setRegistros((prev) => prev.filter((_, i) => i !== index));
  };

  // Agregar nueva fila vacía
  const agregarFila = () => {
    setRegistros((prev) => [
      ...prev,
      { empleadoId: '', fecha: '', horas: '', guardado: false },
    ]);
  };

  // Guardar datos de factura (estado y número)
  const guardarFactura = async () => {
    const res = await fetch(api(`/ordenes-trabajo/${id}/factura`), {
      method: 'PUT',
      body: JSON.stringify({ estadoFactura, numeroFactura }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) alert('Factura guardada');
    else alert('Error al guardar factura');
  };

  if (!orden) return <p className="p-4">Cargando orden...</p>;

  // Agrupar stock por ID y sumar cantidades
const stockAgrupado = orden.stockAsignado?.reduce<Record<number, StockAsignado>>((acc, s) => {
  if (!acc[s.stockId]) {
    acc[s.stockId] = { ...s };
  } else {
    acc[s.stockId].cantidadUtilizada += s.cantidadUtilizada;
  }
  return acc;
}, {});

// Filtrar herramientas sin repeticiones
const herramientasUnicas = Array.from(
  new Map(
    (orden.herramientas ?? []).map((h) => [h.herramientaId, h])
  ).values()
);

// Agrupar empleados por rol y eliminar duplicados
const tecnicos = Array.from(
  new Map(
    orden.empleadosAsignados
      ?.filter((e) => e.rol === 'TECNICO')
      .map((e) => [e.empleadoId, e])
  ).values()
);

const certificadores = Array.from(
  new Map(
    orden.empleadosAsignados
      ?.filter((e) => e.rol === 'CERTIFICADOR')
      .map((e) => [e.empleadoId, e])
  ).values()
);


  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Fase 4: Cierre y factura</h1>
      <section className="bg-gray-50 border rounded p-4 space-y-2">
  <h2 className="text-xl font-semibold">Resumen general</h2>

  {orden.avion && (
    <p>
      <strong>Avión:</strong> {orden.avion.matricula} - {orden.avion.marca} {orden.avion.modelo}
    </p>
  )}

  {orden.componente && (
    <p>
      <strong>Componente:</strong> {orden.componente.tipo} - {orden.componente.marca} {orden.componente.modelo}
    </p>
  )}

  {orden.solicitud && (
    <p>
      <strong>Solicitud:</strong> {orden.solicitud}
    </p>
  )}

  {orden.solicitadoPor && (
    <p>
      <strong>Solicitado por:</strong> {orden.solicitadoPor}
    </p>
  )}

  {orden.inspeccionRecibida !== undefined && (
    <p>
      <strong>Inspección al recibir:</strong> {orden.inspeccionRecibida ? 'Sí' : 'No'}
    </p>
  )}

  {orden.danosPrevios && (
    <p>
      <strong>Daños previos:</strong> {orden.danosPrevios}
    </p>
  )}

  {orden.accionTomada && (
    <p>
      <strong>Acción tomada:</strong> {orden.accionTomada}
    </p>
  )}

  {orden.observaciones && (
    <p>
      <strong>Observaciones:</strong> {orden.observaciones}
    </p>
  )}

{!!herramientasUnicas.length && (
  <div>
    <strong>Herramientas:</strong>
    <ul className="list-disc ml-6">
      {herramientasUnicas.map((h, i) => (
        <li key={i}>
          {h.herramienta.nombre}
          {(h.herramienta.marca || h.herramienta.modelo) &&
            ` (${h.herramienta.marca ?? ''} ${h.herramienta.modelo ?? ''})`}
        </li>
      ))}
    </ul>
  </div>
)}


{!!stockAgrupado && (
  <div>
    <strong>Stock:</strong>
    <ul className="list-disc ml-6">
      {Object.values(stockAgrupado).map((s, i) => (
        <li key={i}>
          {s.stock.nombre}
          {(s.stock.marca || s.stock.modelo) &&
            ` (${s.stock.marca ?? ''} ${s.stock.modelo ?? ''})`}
          {' - '}
          {s.cantidadUtilizada} unidad(es)
        </li>
      ))}
    </ul>
  </div>
)}


{!!orden.empleadosAsignados?.length && (
  <div className="space-y-2">
    {!!certificadores.length && (
      <div>
        <strong>Certificadores:</strong>
        <ul className="list-disc ml-6">
          {certificadores.map((e, i) => (
            <li key={`cert-${i}`}>
              {e.empleado.nombre} {e.empleado.apellido}
            </li>
          ))}
        </ul>
      </div>
    )}

    {!!tecnicos.length && (
      <div>
        <strong>Técnicos:</strong>
        <ul className="list-disc ml-6">
          {tecnicos.map((e, i) => (
            <li key={`tec-${i}`}>
              {e.empleado.nombre} {e.empleado.apellido}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}


</section>


      {/* Registros */}
      <section>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Registro de trabajo</h2>
          <button
            onClick={agregarFila}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Agregar fila
          </button>
        </div>

        <div className="grid gap-3 mt-4">
          {registros.map((r, i) => (
            <div key={i} className="grid grid-cols-6 items-center gap-2">
              <select
                value={r.empleadoId}
                onChange={(e) => updateRegistro(i, 'empleadoId', Number(e.target.value))}
                className={`border rounded px-2 py-1 ${!r.empleadoId ? 'border-red-500' : ''}`}
              >
                <option value="">Seleccionar</option>
                {personal.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={r.fecha}
                onChange={(e) => updateRegistro(i, 'fecha', e.target.value)}
                className={`border rounded px-2 py-1 ${!r.fecha ? 'border-red-500' : ''}`}
              />
              <input
                type="number"
                step="0.5"
                min={0}
                value={r.horas}
                onChange={(e) => updateRegistro(i, 'horas', e.target.value ? parseFloat(e.target.value) : '')}
                className={`border rounded px-2 py-1 ${!r.horas ? 'border-red-500' : ''}`}
              />
              <button
                onClick={() => guardarRegistro(i)}
                className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                title="Guardar registro"
              >
                💾
              </button>
              <button
                onClick={() => eliminarFila(i)}
                className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                title="Eliminar fila"
              >
                🗑
              </button>
              {r.guardado && <span className="text-green-600">✔</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Factura */}
      <section>
        <h2 className="text-xl font-semibold mt-6">Factura</h2>

        <label className="block font-medium mt-4 mb-1">Número de factura</label>
        <input
          className="border rounded w-full px-2 py-1"
          value={numeroFactura}
          onChange={(e) => setNumeroFactura(e.target.value)}
        />

        <label className="block font-medium mt-4 mb-1">Estado de factura</label>
        <select
          className="border rounded w-full px-2 py-1"
          value={estadoFactura}
          onChange={(e) =>
            setEstadoFactura(
              e.target.value as OrdenTrabajo['estadoFactura']
            )
          }
        >
          <option value="">— Seleccionar —</option>
          <option value="NO_ENVIADA">No enviada</option>
          <option value="ENVIADA">Enviada</option>
          <option value="PAGA">Paga</option>
        </select>

       <div className="mt-6">
  <button
    onClick={() => setMostrarSubirFactura(true)}
    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
  >
    Subir archivo de factura
  </button>
  <SubirArchivo
    open={mostrarSubirFactura}
    onClose={() => setMostrarSubirFactura(false)}
    url={api(`/ordenes-trabajo/${id}/factura`)}
    label="Subir archivo de factura"
    nombreCampo="archivoFactura"
    onUploaded={() => {
      setMostrarSubirFactura(false);
      fetch(api(`/ordenes-trabajo/${id}`))
        .then((res) => res.json())
        .then((data: OrdenTrabajo) => setOrden(data));
    }}
  />
  {orden.archivoFactura && (
    <div className="mt-2">
      Archivo actual:{' '}
      <a
        href={orden.archivoFactura}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver archivo
      </a>
    </div>
  )}
</div>

      </section>
      <div className="flex justify-between mt-8">
  <button
    onClick={() => window.location.href = `/ordenes-trabajo/${id}/fase3`}
    className="text-blue-600 hover:underline"
  >
    ← Fase anterior
  </button>

<button
  onClick={async () => {
    const confirmar = confirm('¿Estás segura que querés cerrar esta orden de trabajo? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    const res = await fetch(api(`/ordenes-trabajo/${id}/cerrar`), {
      method: 'PUT',
    });

    if (res.ok) {
      alert('Orden cerrada con éxito');
window.location.href = `/ordenes-trabajo/${id}/cerrada`;    } else {
      alert('Error al cerrar la orden');
    }
  }}
  className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-semibold shadow"
>
  Cerrar orden de trabajo
</button>

</div>
    </div>
    
  );
}