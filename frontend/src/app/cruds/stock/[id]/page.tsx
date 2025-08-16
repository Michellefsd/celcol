'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api } from '@/services/api';
import VolverAtras from '@/components/Arrow';

interface StockItem {
  id: number;
  nombre: string;
  tipoProducto?: string;
  codigoBarras?: string;
  notasInternas?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  puedeSerVendido?: boolean;
  puedeSerComprado?: boolean;
  precioVenta?: number;
  coste?: number;
  unidadMedida?: string;
  cantidad: number;
  stockMinimo: number;
  fechaIngreso?: string;
  imagen?: string;
  archivo?: string; // legacy (compat)
}

type IdLike = number | string;

interface FacturaStock {
  id: IdLike;             // puede venir "legacy-<stockId>"
  stockId: number;
  numero?: string | null;
  proveedor?: string | null;
  fecha?: string | null;  // ISO
  monto?: number | string | null;
  moneda?: string | null;
  archivo: string;        // "uploads/..."
  creadoEn?: string;
  legacy?: boolean;       // marcado por el backend para compat
}

export default function DetalleStockPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [item, setItem] = useState<StockItem | null>(null);
  const [facturas, setFacturas] = useState<FacturaStock[]>([]);
  const [mostrarSubirImagen, setMostrarSubirImagen] = useState(false);
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editFactura, setEditFactura] = useState<FacturaStock | null>(null);

  const cargarProducto = async () => {
    if (!id) return;
    try {
      const res = await fetch(api(`/stock/${id}`));
      if (!res.ok) throw new Error(`No se pudo obtener el producto (${res.status})`);
      const data = await res.json();
      setItem(data);
    } catch (err) {
      console.error('❌ Error al cargar el producto de stock:', err);
    }
  };

  const cargarFacturas = async () => {
    if (!id) return;
    try {
      const res = await fetch(api(`/stock/${id}/facturas`));
      if (!res.ok) throw new Error(`No se pudieron obtener las facturas (${res.status})`);
      const data = (await res.json()) as FacturaStock[];
      setFacturas(data);
    } catch (err) {
      console.error('❌ Error al cargar facturas:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([cargarProducto(), cargarFacturas()]);
      setLoading(false);
    })();
  }, [id]);

  const esVisualizableEnNavegador = (url: string): boolean => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  };

  const eliminarFactura = async (facturaId: IdLike) => {
    if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(api(`/stock/facturas/${facturaId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error(`No se pudo eliminar la factura (${res.status})`);
      await cargarFacturas();
    } catch (err) {
      console.error('❌ Error al eliminar factura:', err);
      alert('No se pudo eliminar la factura.');
    }
  };

  if (loading) return <p className="text-gray-500 p-6">Cargando producto...</p>;
  if (!item) return <p className="text-rose-600 p-6">No se encontró el producto.</p>;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <VolverAtras texto="Volver a la lista de stock" />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles del producto</h1>

        <div className="max-w-4xl space-y-6">
          {/* Datos del producto */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900">{item.nombre}</h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              {item.tipoProducto && <p><span className="text-slate-500">Tipo:</span> {item.tipoProducto}</p>}
              {item.codigoBarras && <p><span className="text-slate-500">Código de barras:</span> {item.codigoBarras}</p>}
              {item.marca && <p><span className="text-slate-500">Marca:</span> {item.marca}</p>}
              {item.modelo && <p><span className="text-slate-500">Modelo:</span> {item.modelo}</p>}
              {item.numeroSerie && <p><span className="text-slate-500">N° Serie:</span> {item.numeroSerie}</p>}
              <p><span className="text-slate-500">Puede venderse:</span> {item.puedeSerVendido ? 'Sí' : 'No'}</p>
              <p><span className="text-slate-500">Precio de venta:</span> {item.precioVenta != null ? `$${item.precioVenta.toFixed(2)}` : '-'}</p>
              <p><span className="text-slate-500">Puede comprarse:</span> {item.puedeSerComprado ? 'Sí' : 'No'}</p>
              <p><span className="text-slate-500">Coste:</span> {item.coste != null ? `$${item.coste.toFixed(2)}` : '-'}</p>
              <p><span className="text-slate-500">Cantidad:</span> {item.cantidad}</p>
              <p><span className="text-slate-500">Stock mínimo:</span> {item.stockMinimo}</p>
              {item.unidadMedida && <p><span className="text-slate-500">Unidad:</span> {item.unidadMedida}</p>}
              {item.fechaIngreso && (
                <p><span className="text-slate-500">Fecha ingreso:</span> {new Date(item.fechaIngreso).toLocaleDateString()}</p>
              )}
              {item.notasInternas && (
                <p className="sm:col-span-2"><span className="text-slate-500">Notas internas:</span> {item.notasInternas}</p>
              )}
            </div>

            {/* Imagen */}
            <div className="mt-6">
              {item.imagen ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Imagen del producto</h3>
                  <img
                    src={item.imagen}
                    alt="Imagen del stock"
                    className="mt-2 max-w-xs rounded-lg border border-slate-300"
                  />
                  <button
                    onClick={() => setMostrarSubirImagen(true)}
                    className="text-sm text-cyan-600 underline underline-offset-2 hover:text-cyan-800"
                  >
                    Reemplazar imagen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarSubirImagen(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
                >
                  Subir imagen
                </button>
              )}
            </div>
          </section>

          {/* Facturas */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Facturas</h3>
              <button
                onClick={() => setMostrarSubirFactura(true)}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-4 py-2 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4]"
              >
                Agregar factura
              </button>
            </div>

            {facturas.length === 0 ? (
              <p className="text-sm text-slate-500">Sin facturas registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Número</th>
                      <th className="text-left px-3 py-2">Proveedor</th>
                      <th className="text-left px-3 py-2">Monto</th>
                      <th className="text-left px-3 py-2">Archivo</th>
                      <th className="text-left px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {facturas.map((f) => {
                      const verUrl = api(`/${f.archivo}`);
                      const fechaFmt = f.fecha ? new Date(f.fecha).toLocaleDateString() : '';
                      const montoNum = f.monto != null ? Number(f.monto) : null;
                      const montoFmt = montoNum != null ? `${f.moneda ?? ''} ${montoNum.toFixed(2)}`.trim() : '';
                      return (
                        <tr key={String(f.id)}>
                          <td className="px-3 py-2">{fechaFmt}</td>
                          <td className="px-3 py-2">{f.numero ?? (f.legacy ? 'LEGACY' : '')}</td>
                          <td className="px-3 py-2">{f.proveedor ?? ''}</td>
                          <td className="px-3 py-2">{montoFmt}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-3">
                              {esVisualizableEnNavegador(f.archivo) && (
                                <a
                                  href={verUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                                >
                                  Ver
                                </a>
                              )}
                              <a
                                href={verUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-700 hover:text-slate-900 underline underline-offset-2"
                              >
                                Descargar
                              </a>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-3">
                              {!f.legacy && (
                                <button
                                  onClick={() => setEditFactura(f)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                onClick={() => eliminarFactura(f.id)}
                                className="text-rose-600 hover:text-rose-700"
                                title="Eliminar"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Modales de subida */}
          <SubirArchivo
            open={mostrarSubirFactura}
            onClose={() => setMostrarSubirFactura(false)}
            url={api(`/stock/${item.id}/facturas`)}   // nuevo endpoint
            label="Subir factura (PDF o imagen)"
            nombreCampo="archivo"
            onUploaded={async () => {
              setMostrarSubirFactura(false);
              await cargarFacturas();
            }}
          />

          <SubirArchivo
            open={mostrarSubirImagen}
            onClose={() => setMostrarSubirImagen(false)}
            url={api(`/stock/${item.id}/imagen`)}
            label="Subir nueva imagen"
            nombreCampo="imagen"
            onUploaded={async () => {
              setMostrarSubirImagen(false);
              await cargarProducto();
            }}
          />

          {/* Modal de edición de metadatos */}
          <EditFacturaModal
            open={!!editFactura}
            initial={editFactura}
            onClose={() => setEditFactura(null)}
            onSaved={async () => {
              setEditFactura(null);
              await cargarFacturas();
            }}
          />
        </div>
      </main>
    </div>
  );
}

/* ===========================
   MODAL: EDITAR METADATOS FACTURA
   =========================== */
function EditFacturaModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: FacturaStock | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    numero: initial?.numero ?? '',
    proveedor: initial?.proveedor ?? '',
    fecha: initial?.fecha ? initial.fecha.slice(0, 10) : '',
    monto: initial?.monto != null ? String(initial.monto) : '',
    moneda: initial?.moneda ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      numero: initial?.numero ?? '',
      proveedor: initial?.proveedor ?? '',
      fecha: initial?.fecha ? initial.fecha.slice(0, 10) : '',
      monto: initial?.monto != null ? String(initial.monto) : '',
      moneda: initial?.moneda ?? '',
    });
  }, [initial]);

  if (!open || !initial) return null;

  const submit = async () => {
    try {
      setSaving(true);
      const res = await fetch(api(`/stock/facturas/${initial.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto: form.monto === '' ? null : form.monto,
        }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar la factura');
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Error al actualizar la factura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Editar factura</h3>

          <div className="grid gap-3">
            <div>
              <label className="text-sm text-slate-600">Número</label>
              <input
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2"
                value={form.numero}
                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Proveedor</label>
              <input
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2"
                value={form.proveedor}
                onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Fecha</label>
              <input
                type="date"
                className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Monto</label>
                <input
                  inputMode="decimal"
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={form.monto}
                  onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Moneda</label>
                <input
                  className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2"
                  value={form.moneda}
                  onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              disabled={saving}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
