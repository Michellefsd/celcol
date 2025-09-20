'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';
import { api, fetchJson } from '@/services/api';
import VolverAtras from '@/components/Arrow';

type ArchivoRef = {
  id: number;
  storageKey: string;
  mime?: string | null;
  originalName?: string | null;
  sizeAlmacen?: number | null;
  urlPublica?: string | null; // opcional: si tu backend la expone
};

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

  // relaciones Archivo (no strings)
  imagen?: ArchivoRef | null;
  archivo?: ArchivoRef | null;
}

type IdLike = number | string;

interface FacturaStock {
  id: IdLike;
  stockId: number;
  numero?: string | null;
  proveedor?: string | null;
  fecha?: string | null;           // ISO
  monto?: number | string | null;
  moneda?: string | null;
  archivo?: ArchivoRef | null;     // relación normalizada por el backend
  creadoEn?: string;
  legacy?: boolean;
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

  // ===== cargar datos =====
  const cargarProducto = async () => {
    if (!id) return;
    try {
      const data = await fetchJson<StockItem>(`/stock/${id}`); 
      setItem(data);
    } catch (err) {
      console.error('❌ Error al cargar el producto de stock:', err);
    }
  };

  const cargarFacturas = async () => {
    if (!id) return;
    try {
      const data = await fetchJson<FacturaStock[]>(`/stock/${id}/facturas`);
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

  // ===== Helpers URL firmada (imagen y facturas) =====


  async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
    const q = new URLSearchParams({ key, disposition }).toString();
    return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
  }

   // Abrir ventana antes del await (evita bloqueos de popup)
  async function abrirConPresign(storageKey: string, disposition: 'inline' | 'attachment') {
    const win = window.open('about:blank', '_blank');
    try {
      const { url } = await obtenerUrlFirmada(storageKey, disposition);
      if (!url) throw new Error('No llegó URL firmada');

      if (win) {
        setTimeout(() => win.location.replace(url), 60);
      } else {
        // fallback si el popup fue bloqueado
        if (disposition === 'attachment') {
          const a = document.createElement('a');
          a.href = url;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          window.open(url, '_blank');
        }
      }
    } catch (e) {
      win?.close();
      console.error('❌ No se pudo obtener URL firmada:', e);
      alert('No se pudo abrir el archivo.');
    }
  }

  const abrirEnNuevaPestana = (url: string) => {
    const win = window.open('about:blank', '_blank');
    if (win) setTimeout(() => (win.location.href = url), 60);
    else window.open(url, '_blank');
  };

  // ===== Imagen: preview cuadrado con cover (cacheamos una sola URL) =====
  const [imagenUrl, setImagenUrl] = useState<string>('');
  const [cargandoImg, setCargandoImg] = useState(false);

  const esArchivoRef = (v: any): v is ArchivoRef =>
    v && typeof v === 'object' && typeof v.storageKey === 'string';

  useEffect(() => {
    const run = async () => {
      if (!item?.imagen) {
        setImagenUrl('');
        return;
      }

      // si el backend ya devuelve urlPublica, úsala directo
      if (esArchivoRef(item.imagen) && item.imagen.urlPublica) {
        setImagenUrl(item.imagen.urlPublica);
        return;
      }

      // si sólo hay storageKey -> pedimos firmada (inline) 1 vez
      if (esArchivoRef(item.imagen) && item.imagen.storageKey) {
        try {
          setCargandoImg(true);
          const { url } = await obtenerUrlFirmada(item.imagen.storageKey, 'inline');
          setImagenUrl(url || '');
        } catch {
          setImagenUrl('');
        } finally {
          setCargandoImg(false);
        }
        return;
      }

      // compat raro
      setImagenUrl('');
    };

    run();
  }, [item?.imagen]);

  const verImagen = async () => {
    const key = item?.imagen?.storageKey;
    if (!key) return;
    try {
      const { url } = await obtenerUrlFirmada(key, 'inline');
      if (url) abrirEnNuevaPestana(url);
    } catch (e) {
      console.error('❌ No se pudo abrir la imagen:', e);
    }
  };

  const descargarImagen = async () => {
    const key = item?.imagen?.storageKey;
    if (!key) return;
    try {
      const { url } = await obtenerUrlFirmada(key, 'attachment');
      if (url) abrirEnNuevaPestana(url);
    } catch (e) {
      console.error('❌ No se pudo descargar la imagen:', e);
    }
  };

  // ===== Facturas: eliminar (ver/descargar lo harás en los botones usando archivo.storageKey) =====
  const eliminarFactura = async (facturaId: IdLike) => {
    if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(api(`/stock/facturas/${facturaId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
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


 {/* Imagen */}
<div className="mt-6">
  {imagenUrl ? (
    <div className="relative inline-block">
      {/* Contenedor cuadrado */}
      <div
        className="w-48 h-48 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm"
        title="Ver en grande"
      >
        {cargandoImg ? (
          <div className="w-full h-full grid place-items-center text-slate-500 text-sm">
            Cargando…
          </div>
        ) : (
          <img
            src={imagenUrl}
            alt="Imagen del stock"
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={verImagen}
            draggable={false}
          />
        )}
      </div>

      {/* Botón lápiz (reemplazar) */}
      <button
        type="button"
        onClick={() => setMostrarSubirImagen(true)}
        className="absolute -top-2 -right-2 inline-flex items-center justify-center w-9 h-9 rounded-full shadow-sm border border-slate-200 bg-white hover:bg-slate-50"
        title="Reemplazar imagen"
      >
        ✏️
      </button>
    </div>
  ) : (
    <button
      onClick={() => setMostrarSubirImagen(true)}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-slate-600 hover:bg-slate-50"
      title="Subir imagen"
    >
      <span className="text-xl">🖼️</span>
      <span>Subir imagen</span>
    </button>
  )}
</div>


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
            const fechaFmt = f.fecha ? new Date(f.fecha).toLocaleDateString() : '';
            const montoNum = f.monto != null ? Number(f.monto) : null;
            const montoFmt = montoNum != null ? `${f.moneda ?? ''} ${montoNum.toFixed(2)}`.trim() : '';

            const storageKey = f.archivo?.storageKey ?? null;

            // ✅ abrir la pestaña ANTES del await (evita bloqueo)
            const verFactura = () => {
              if (!storageKey) return;
              abrirConPresign(storageKey, 'inline');
            };

            const descargarFactura = () => {
              if (!storageKey) return;
              abrirConPresign(storageKey, 'attachment');
            };

            return (
              <tr key={String(f.id)}>
                <td className="px-3 py-2">{fechaFmt}</td>
                <td className="px-3 py-2">{f.numero ?? (f.legacy ? 'LEGACY' : '')}</td>
                <td className="px-3 py-2">{f.proveedor ?? ''}</td>
                <td className="px-3 py-2">{montoFmt}</td>

                {/* Archivo */}
                <td className="px-3 py-2">
                  <div className="flex gap-3">
                    {storageKey ? (
                      <>
                        <button
                          type="button"
                          onClick={verFactura}
                          className="text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={descargarFactura}
                          className="text-slate-700 hover:text-slate-900 underline underline-offset-2"
                        >
                          Descargar
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
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
        credentials: 'include', // ✔ envía cookies
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
