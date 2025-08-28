'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, fetchJson } from '@/services/api';
import SelectorDinamico from '@/components/SelectorDinamico';
import AsignacionesActuales from '@/components/AsignacionesActuales';

type Avion = {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  TSN?: number;
  vencimientoMatricula?: string;
  vencimientoSeguro?: string;
  certificadoMatricula?: string;
  ComponenteAvion?: {
    id: number;
    tipo?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    TSN?: number;
    TSO?: number;
    TBOHoras?: number;
    TBOFecha?: string;
  }[];
};

type Propietario = {
  tipoPropietario: 'PERSONA' | 'EMPRESA';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
  rut?: string;
};

type ComponenteExterno = {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  TSN?: number;
  TSO?: number;
  TBOHoras?: number;
  TBOFecha?: string;
  propietarioId?: number;
  propietario?: Propietario;
};

type ArchivoRef = {
  id: number;
  storageKey: string;
  mime?: string;
  originalName?: string;
  sizeAlmacen?: number;
};


type OrdenTrabajo = {
  id: number;
  estadoOrden: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  solicitudFirma?: ArchivoRef | null;  
  avionId?: number;
  avion?: Avion;
  componenteId?: number;
  componente?: ComponenteExterno;
  solicitud?: string;
  solicitadoPor?: string;
  OTsolicitud?: string;
  inspeccionRecibida?: boolean;
  danosPrevios?: string;
  accionTomada?: string;
  observaciones?: string;
};

type Herramienta = {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
};

type Stock = {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  cantidad: number;
};

type Personal = {
  id: number;
  nombre: string;
  apellido: string;
  esTecnico: boolean;
  esCertificador: boolean;
};

type SeleccionDinamica = {
  id: number;
  nombre: string;
  cantidad?: number;
};

// 👇 rol opcional para coincidir con backend actual
type OrdenExtendida = OrdenTrabajo & {
  herramientas: { herramientaId: number; herramienta: Herramienta }[];
  stockAsignado: { stockId: number; cantidadUtilizada: number; stock: Stock }[];
  empleadosAsignados: { empleadoId: number; empleado: Personal; rol?: 'TECNICO' | 'CERTIFICADOR' }[];
};

export default function Fase3OrdenTrabajoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [inspeccionRecibida, setInspeccionRecibida] = useState(false);
  const [danosPrevios, setDanosPrevios] = useState('');
  const [accionTomada, setAccionTomada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);

  const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState<SeleccionDinamica[]>([]);
  const [stockSeleccionado, setStockSeleccionado] = useState<SeleccionDinamica[]>([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState<SeleccionDinamica[]>([]);
  const [certificadoresSeleccionados, setCertificadoresSeleccionados] = useState<SeleccionDinamica[]>([]);

  function renderCampo(label: string, valor: any) {
    if (valor === null || valor === undefined || valor === '') return null;
    return (
      <p>
        <strong>{label}:</strong> {valor}
      </p>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        // 🔐 Carga de la OT
        const data = await fetchJson<OrdenExtendida>(`/ordenes-trabajo/${id}`);

        // redirecciones por estado
        if (data.estadoOrden === 'CERRADA') {
          router.replace(`/ordenes-trabajo/${id}/cerrada`);
          return;
        }
        if (data.estadoOrden === 'CANCELADA') {
          router.replace(`/ordenes-trabajo/${id}/cancelada`);
          return;
        }

        setOrden(data);
        setInspeccionRecibida(data.inspeccionRecibida ?? false);
        setDanosPrevios(data.danosPrevios ?? '');
        setAccionTomada(data.accionTomada ?? '');
        setObservaciones(data.observaciones ?? '');

        // ✅ Herramientas asignadas actuales
        setHerramientasSeleccionadas(
          Array.isArray(data.herramientas)
            ? data.herramientas.map((h) => ({
                id: h.herramientaId,
                nombre: h.herramienta?.nombre ?? '',
              }))
            : []
        );

        // ✅ Stock asignado actual
        setStockSeleccionado(
          Array.isArray(data.stockAsignado)
            ? data.stockAsignado.map((s) => ({
                id: s.stockId,
                nombre: s.stock?.nombre ?? '',
                cantidad: s.cantidadUtilizada,
              }))
            : []
        );

        // ✅ Empleados por rol (tolerante a que rol no venga en algunos)
        type EmpleadoConRol = { empleadoId: number; empleado: Personal; rol: 'TECNICO' | 'CERTIFICADOR' };
        const conRol = (Array.isArray(data.empleadosAsignados) ? data.empleadosAsignados : [])
          .filter((e: any): e is EmpleadoConRol => e && (e.rol === 'TECNICO' || e.rol === 'CERTIFICADOR'));

        setTecnicosSeleccionados(
          conRol
            .filter((e) => e.rol === 'TECNICO')
            .map((e) => ({
              id: e.empleadoId,
              nombre: `${e.empleado?.nombre ?? ''} ${e.empleado?.apellido ?? ''}`,
            }))
        );

        setCertificadoresSeleccionados(
          conRol
            .filter((e) => e.rol === 'CERTIFICADOR')
            .map((e) => ({
              id: e.empleadoId,
              nombre: `${e.empleado?.nombre ?? ''} ${e.empleado?.apellido ?? ''}`,
            }))
        );
      } catch (err) {
        console.error('Error cargando OT:', err);
        setOrden(null);
      }

      // 🔐 Listas auxiliares
      try {
        const [herr, stk, pers] = await Promise.all([
          fetchJson<any>(`/herramientas`),
          fetchJson<any>(`/stock`),
          fetchJson<any>(`/personal`),
        ]);

        setHerramientas(Array.isArray(herr) ? herr : Array.isArray(herr?.items) ? herr.items : []);
        setStock(Array.isArray(stk) ? stk : Array.isArray(stk?.items) ? stk.items : []);
        setPersonal(Array.isArray(pers) ? pers : Array.isArray(pers?.items) ? pers.items : []);
      } catch {
        setHerramientas([]);
        setStock([]);
        setPersonal([]);
      }
    })();
  }, [id, router]);

  const handleGuardar = async () => {
    try {
      const payload = {
        inspeccionRecibida,
        danosPrevios,
        accionTomada,
        observaciones,
        herramientas: herramientasSeleccionadas.map((h) => h.id),
        stock: stockSeleccionado.map((s) => ({
          stockId: s.id,
          cantidad: s.cantidad ?? 1,
        })),
        certificadores: certificadoresSeleccionados.map((c) => c.id),
        tecnicos: tecnicosSeleccionados.map((t) => t.id),
      };

      const updated = await fetchJson<OrdenExtendida>(`/ordenes-trabajo/${id}/fase3`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      alert('Datos guardados correctamente');
      setOrden(updated);
    } catch (e: any) {
      console.error(e);
      alert(e?.body?.error || 'Error al guardar');
    }
  };

  if (!orden) return <p className="p-4">Cargando orden...</p>;

  // 🔐 Mapa de máximos disponibles por stock ID
  const stockMaximos = stock.reduce((acc, item) => {
    acc[item.id] = item.cantidad;
    return acc;
  }, {} as Record<number, number>);

async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
  const q = new URLSearchParams({ key, disposition }).toString();
  return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
}

async function verSolicitudArchivo(key?: string) {
  if (!key) return;
  const win = window.open('about:blank', '_blank'); // abre YA para evitar bloqueos
  try {
    const { url } = await obtenerUrlFirmada(key, 'inline');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60); // ayuda Safari/Pop-up blockers
  } catch (e) {
    win?.close();
    console.error('❌ No se pudo abrir el archivo de solicitud:', e);
  }
}

async function descargarSolicitudArchivo(key?: string) {
  if (!key) return;
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await obtenerUrlFirmada(key, 'attachment');
    if (!url) { win?.close(); return; }
    setTimeout(() => win && (win.location.replace(url)), 60);
  } catch (e) {
    win?.close();
    console.error('❌ No se pudo descargar el archivo de solicitud:', e);
  }
}




  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Fase 3: Recepción y preparación</h1>

        {/* Resumen del objeto */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Tipo:</span>{' '}
              <span className="text-slate-800 font-medium">
                {orden.avionId ? 'Avión' : 'Componente externo'}
              </span>
            </p>

            {orden.avion && (
              <>
                <p>
                  <span className="text-slate-500">Avión:</span>{' '}
                  <a
                    href={`/cruds/aviones/${orden.avion.id}`}
                    className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {orden.avion.matricula} — {orden.avion.marca} {orden.avion.modelo}
                  </a>
                </p>

                {renderCampo('Número de serie', orden.avion.numeroSerie)}
                {orden.avion.TSN != null && (
                  <p><span className="text-slate-500">TSN:</span> {orden.avion.TSN} hs</p>
                )}
                {orden.avion.vencimientoMatricula && (
                  <p><span className="text-slate-500">Vencimiento matrícula:</span> {new Date(orden.avion.vencimientoMatricula).toLocaleDateString()}</p>
                )}
                {orden.avion.vencimientoSeguro && (
                  <p><span className="text-slate-500">Vencimiento seguro:</span> {new Date(orden.avion.vencimientoSeguro).toLocaleDateString()}</p>
                )}

                {orden.avion.certificadoMatricula && (
                  <div className="mt-2 flex gap-3 items-center text-sm">
                    <a
                      href={api(`/${orden.avion.certificadoMatricula}`)}
                      className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      👁️ Ver certificado de matrícula
                    </a>
                    <a
                      href={api(`/${orden.avion.certificadoMatricula}`)}
                      download
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      Descargar
                    </a>
                  </div>
                )}

                {Array.isArray(orden.avion.ComponenteAvion) && orden.avion.ComponenteAvion.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-slate-800">Componentes instalados:</p>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {orden.avion.ComponenteAvion.map((c) => (
                        <li key={c.id}>
                          {c.tipo ?? '—'} — {c.marca ?? '—'} {c.modelo ?? ''} (N° Serie: {c.numeroSerie ?? '—'})
                          {c.TSN != null && ` — TSN: ${c.TSN} hs`}
                          {c.TSO != null && ` — TSO: ${c.TSO} hs`}
                          {c.TBOHoras != null && ` — TBO: ${c.TBOHoras} hs`}
                          {c.TBOFecha && ` — Fecha TBO: ${new Date(c.TBOFecha).toLocaleDateString()}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {orden.componente && (
              <>
                <p>
                  <span className="text-slate-500">Componente externo:</span>{' '}
                  <a
                    href={`/cruds/propietarios/${orden.componente.propietarioId}`}
                    className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {orden.componente.tipo} — {orden.componente.marca} {orden.componente.modelo}
                  </a>
                </p>

                {renderCampo('N° Serie', orden.componente.numeroSerie)}
                {orden.componente.TSN != null && (
                  <p><span className="text-slate-500">TSN:</span> {orden.componente.TSN} hs</p>
                )}
                {orden.componente.TSO != null && (
                  <p><span className="text-slate-500">TSO:</span> {orden.componente.TSO} hs</p>
                )}
                {orden.componente.TBOHoras != null && (
                  <p><span className="text-slate-500">TBO:</span> {orden.componente.TBOHoras} hs</p>
                )}
                {orden.componente.TBOFecha && (
                  <p><span className="text-slate-500">Fecha TBO:</span> {new Date(orden.componente.TBOFecha).toLocaleDateString()}</p>
                )}

                {orden.componente.propietario && (
                  <div className="mt-1">
                    <p className="font-semibold text-slate-800">Propietario:</p>
                    <p className="text-slate-700">
                      {orden.componente.propietario.tipoPropietario === 'PERSONA'
                        ? `${orden.componente.propietario.nombre} ${orden.componente.propietario.apellido}`
                        : `${orden.componente.propietario.nombreEmpresa} (${orden.componente.propietario.rut})`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Datos de la solicitud original */}
        {(orden.solicitud || orden.solicitadoPor || orden.OTsolicitud || orden.solicitudFirma) && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-2 text-sm">
            <p className="font-semibold text-slate-800">Datos de la solicitud original</p>
            {orden.solicitud && (
              <p><span className="text-slate-500">Descripción del trabajo solicitado:</span> {orden.solicitud}</p>
            )}
            {orden.solicitadoPor && (
              <p><span className="text-slate-500">Solicitado por:</span> {orden.solicitadoPor}</p>
            )}
            {orden.OTsolicitud && (
              <p><span className="text-slate-500">N.º de OT previa:</span> {orden.OTsolicitud}</p>
            )}
            {orden.solicitudFirma?.storageKey && (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => verSolicitudArchivo(orden.solicitudFirma!.storageKey)}
      className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
    >
      👁️ Ver archivo de solicitud
    </button>
    <button
      type="button"
      onClick={() => descargarSolicitudArchivo(orden.solicitudFirma!.storageKey)}
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
    >
      Descargar
    </button>
  </div>
)}

          </section>
        )}

        {/* Formulario de inspección y observaciones */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={inspeccionRecibida}
              onChange={(e) => {
                const v = e.target.checked;
                setInspeccionRecibida(v);
                if (!v) setDanosPrevios('');
              }}
            />
            <span className="text-slate-700">Inspección de recibimiento realizada</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Inspección previa (daños, condiciones)
            </label>
            <textarea
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                          ${!inspeccionRecibida ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
              rows={3}
              value={danosPrevios}
              onChange={(e) => setDanosPrevios(e.target.value)}
              disabled={!inspeccionRecibida}
              placeholder={inspeccionRecibida ? 'Detalle daños/condiciones' : 'Habilitado al marcar “Inspección de recibimiento”'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Acción tomada</label>
            <textarea
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              rows={2}
              value={accionTomada}
              onChange={(e) => setAccionTomada(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
            <textarea
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {/* Asignaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <SelectorDinamico
                label="Herramientas utilizadas"
                opciones={(Array.isArray(herramientas) ? herramientas : []).map((h) => ({
                  id: h.id,
                  nombre: [h.nombre, h.marca, h.modelo].filter(Boolean).join(' '),
                }))}
                permitirDuplicados={false}
                excluidos={herramientasSeleccionadas.map((h) => h.id)}
                onChange={(nuevos) => setHerramientasSeleccionadas(nuevos)}
              />

              <AsignacionesActuales
                titulo="Herramientas asignadas"
                items={herramientasSeleccionadas}
                editable
                onEliminar={(index) => {
                  const nuevos = [...herramientasSeleccionadas];
                  nuevos.splice(index, 1);
                  setHerramientasSeleccionadas(nuevos);
                }}
              />
            </div>

            <div className="space-y-3">
              <SelectorDinamico
                label="Stock utilizado"
                opciones={stock
                  .filter((s) => s.cantidad > 0 && !stockSeleccionado.some((sel) => sel.id === s.id))
                  .map((s) => ({
                    id: s.id,
                    nombre: [s.nombre, s.marca, s.modelo].filter(Boolean).join(' '),
                  }))}
                conCantidad
                maximos={stockMaximos}
                permitirDuplicados={false}
                onChange={(nuevos) => {
                  const items = Array.isArray(nuevos) ? nuevos : [nuevos];
                  setStockSeleccionado((prev) => {
                    const map = new Map<number, SeleccionDinamica>(prev.map((it) => [it.id, it]));
                    items.forEach((it) => {
                      const anterior = map.get(it.id);
                      const max = stockMaximos[it.id] ?? Infinity;
                      const cantidadCruda = it.cantidad ?? anterior?.cantidad ?? 1;
                      const cantidad = Math.max(1, Math.min(cantidadCruda, max));
                      map.set(it.id, {
                        id: it.id,
                        nombre: it.nombre ?? anterior?.nombre ?? '',
                        cantidad,
                      });
                    });
                    return Array.from(map.values());
                  });
                }}
              />

              <AsignacionesActuales
                titulo="Stock asignado"
                items={stockSeleccionado}
                conCantidad
                editable
                onEliminar={(index) => {
                  const nuevos = [...stockSeleccionado];
                  const eliminado = nuevos.splice(index, 1)[0];
                  setStockSeleccionado(nuevos);
                  if (eliminado?.id && eliminado?.cantidad) {
                    setStock((prev) =>
                      prev.map((s) =>
                        s.id === eliminado.id ? { ...s, cantidad: s.cantidad + eliminado.cantidad! } : s
                      )
                    );
                  }
                }}
                onEditarCantidad={(index, nuevaCantidad) => {
                  const nuevos = [...stockSeleccionado];
                  nuevos[index].cantidad = nuevaCantidad;
                  setStockSeleccionado(nuevos);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <SelectorDinamico
                label="Técnicos asignados"
                opciones={personal
                  .filter((p) => p.esTecnico)
                  .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellido}` }))}
                permitirDuplicados={false}
                onChange={(nuevos) => {
                  const n = Array.isArray(nuevos) ? nuevos : [nuevos];
                  setTecnicosSeleccionados((prev) => {
                    const combinados = [...prev, ...n];
                    return combinados.filter(
                      (item, index, self) => index === self.findIndex((i) => i.id === item.id)
                    );
                  });
                }}
              />

              <AsignacionesActuales
                titulo="Técnicos asignados"
                items={tecnicosSeleccionados.map((t) => ({ ...t, meta: 'TECNICO' }))}
                editable
                onEliminar={(index) => {
                  const nuevos = [...tecnicosSeleccionados];
                  nuevos.splice(index, 1);
                  setTecnicosSeleccionados(nuevos);
                }}
              />
            </div>

            <div className="space-y-3">
              <SelectorDinamico
                label="Certificadores asignados"
                opciones={personal
                  .filter((p) => p.esCertificador)
                  .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellido}` }))}
                permitirDuplicados={false}
                onChange={(nuevos) => {
                  const n = Array.isArray(nuevos) ? nuevos : [nuevos];
                  setCertificadoresSeleccionados((prev) => {
                    const combinados = [...prev, ...n];
                    return combinados.filter(
                      (item, index, self) => index === self.findIndex((i) => i.id === item.id)
                    );
                  });
                }}
              />

              <AsignacionesActuales
                titulo="Certificadores asignados"
                items={certificadoresSeleccionados.map((c) => ({ ...c, meta: 'CERTIFICADOR' }))}
                editable
                onEliminar={(index) => {
                  const nuevos = [...certificadoresSeleccionados];
                  nuevos.splice(index, 1);
                  setCertificadoresSeleccionados(nuevos);
                }}
              />
            </div>
          </div>

          {/* Fases finales + acciones */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              onClick={() => router.push(`/ordenes-trabajo/${id}/fase2`)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                           px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                           transform hover:scale-[1.02] transition-all duration-200"
            >
              ← Fase anterior
            </button>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleGuardar}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white
                           font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4]
                           hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
              >
                Guardar
              </button>
              <button
                onClick={() => router.push(`/ordenes-trabajo/${id}/fase4`)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white
                           px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:border-slate-400
                           transform hover:scale-[1.02] transition-all duración-200"
              >
                Fase siguiente →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

