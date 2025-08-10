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
  archivoFactura?: string;
}

export default function DetalleStockPage() {
  const { id } = useParams(); // ✅ forma más segura y clara
  const [item, setItem] = useState<StockItem | null>(null);
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);
  const [mostrarSubirImagen, setMostrarSubirImagen] = useState(false);

  const cargarProducto = async () => {
    if (!id) return;
    const url = api(`/stock/${id}`);
    try {
      console.log('📦 Fetching stock desde:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo obtener el producto. Código: ${res.status}`);
      const data = await res.json();
      setItem({ ...data, archivoFactura: data.archivo });
    } catch (err) {
      console.error('❌ Error al cargar el producto de stock:', err);
    }
  };

  useEffect(() => {
    cargarProducto();
  }, [id]);

  if (!item) return <p className="text-gray-500">Cargando producto...</p>;

  const esVisualizableEnNavegador = (url: string): boolean => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
  };

/*  return (
    <div>
      <VolverAtras texto="Volver a la lista de stock" />
      
      <h1 className="text-2xl font-bold mb-6">Detalles del Producto</h1>  
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
        <h1 className="text-2xl font-bold">{item.nombre}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {item.tipoProducto && <p><strong>Tipo:</strong> {item.tipoProducto}</p>}
          {item.codigoBarras && <p><strong>Código de barras:</strong> {item.codigoBarras}</p>}
          {item.marca && <p><strong>Marca:</strong> {item.marca}</p>}
          {item.modelo && <p><strong>Modelo:</strong> {item.modelo}</p>}
          {item.numeroSerie && <p><strong>N° Serie:</strong> {item.numeroSerie}</p>}
          <p><strong>Puede venderse:</strong> {item.puedeSerVendido ? 'Sí' : 'No'}</p>
          <p><strong>Precio de venta:</strong> ${item.precioVenta?.toFixed(2) ?? '-'}</p>
          <p><strong>Puede comprarse:</strong> {item.puedeSerComprado ? 'Sí' : 'No'}</p>
          <p><strong>Coste:</strong> ${item.coste?.toFixed(2) ?? '-'}</p>
          <p><strong>Cantidad:</strong> {item.cantidad}</p>
          <p><strong>Stock mínimo:</strong> {item.stockMinimo}</p>
          {item.unidadMedida && <p><strong>Unidad:</strong> {item.unidadMedida}</p>}
          {item.fechaIngreso && (
            <p><strong>Fecha ingreso:</strong> {new Date(item.fechaIngreso).toLocaleDateString()}</p>
          )}
          {item.notasInternas && (
            <p className="sm:col-span-2"><strong>Notas internas:</strong> {item.notasInternas}</p>
          )}
        </div>

        {item.imagen ? (
          <div className="pt-4 space-y-2">
            <h2 className="font-semibold">Imagen del producto</h2>
            <img
              src={item.imagen}
              alt="Imagen del stock"
              className="mt-2 max-w-xs rounded border border-gray-300"
            />
            <button
              onClick={() => setMostrarSubirImagen(true)}
              className="text-sm text-blue-600 underline"
            >
              Reemplazar imagen
            </button>
          </div>
        ) : (
          <div className="pt-4">
            <button
              onClick={() => setMostrarSubirImagen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Subir imagen
            </button>
          </div>
        )}

        {item.archivoFactura ? (
          <div className="pt-4 space-y-2">
            <h2 className="font-semibold">Factura</h2>

            <div className="flex flex-wrap gap-4 mt-2">
              {esVisualizableEnNavegador(item.archivoFactura) && (
                <a
                  href={item.archivoFactura}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 text-blue-600 px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-200 transition"
                >
                  Ver factura
                </a>
              )}

              <a
                href={item.archivoFactura}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Descargar factura
              </a>

              <button
                onClick={() => setMostrarSubirFactura(true)}
                className="text-sm text-blue-600 underline"
              >
                Reemplazar factura
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <button
              onClick={() => setMostrarSubirFactura(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Subir factura
            </button>
          </div>
        )}
      </div>

      <SubirArchivo
        open={mostrarSubirFactura}
        onClose={() => setMostrarSubirFactura(false)}
        url={api(`/stock/${item.id}/archivo`)}
        label="Subir nueva factura"
        nombreCampo="archivo"
        onUploaded={cargarProducto}
      />

      <SubirArchivo
        open={mostrarSubirImagen}
        onClose={() => setMostrarSubirImagen(false)}
        url={api(`/stock/${item.id}/imagen`)}
        label="Subir nueva imagen"
        nombreCampo="imagen"
        onUploaded={cargarProducto}
      />
    </div>
    </div>
  );

  */

  return (
  <div className="min-h-screen bg-slate-100">
    <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <VolverAtras texto="Volver a la lista de stock" />
      </div>

      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Detalles del producto</h1>

      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900">{item.nombre}</h2>

          {/* Info general */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {item.tipoProducto && <p><span className="text-slate-500">Tipo:</span> {item.tipoProducto}</p>}
            {item.codigoBarras && <p><span className="text-slate-500">Código de barras:</span> {item.codigoBarras}</p>}
            {item.marca && <p><span className="text-slate-500">Marca:</span> {item.marca}</p>}
            {item.modelo && <p><span className="text-slate-500">Modelo:</span> {item.modelo}</p>}
            {item.numeroSerie && <p><span className="text-slate-500">N° Serie:</span> {item.numeroSerie}</p>}
            <p><span className="text-slate-500">Puede venderse:</span> {item.puedeSerVendido ? 'Sí' : 'No'}</p>
            <p><span className="text-slate-500">Precio de venta:</span> ${item.precioVenta?.toFixed(2) ?? '-'}</p>
            <p><span className="text-slate-500">Puede comprarse:</span> {item.puedeSerComprado ? 'Sí' : 'No'}</p>
            <p><span className="text-slate-500">Coste:</span> ${item.coste?.toFixed(2) ?? '-'}</p>
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

          {/* Factura */}
          <div className="mt-6">
            {item.archivoFactura ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Factura</h3>
                <div className="flex flex-wrap gap-3">
                  {esVisualizableEnNavegador(item.archivoFactura) && (
                    <a
                      href={api(`/${item.archivoFactura}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                    >
                      👁️ Ver factura
                    </a>
                  )}
                  <a
                    href={api(`/${item.archivoFactura}`)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                  >
                    Descargar
                  </a>
                  <button
                    onClick={() => setMostrarSubirFactura(true)}
                    className="text-sm text-cyan-600 underline underline-offset-2 hover:text-cyan-800"
                  >
                    Reemplazar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setMostrarSubirFactura(true)}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#597BFF] to-[#4a6ee0] text-white font-semibold px-5 py-2.5 shadow-sm hover:from-[#4a6ee0] hover:to-[#3658d4] hover:shadow-lg hover:brightness-110 transform hover:scale-[1.03] transition-all duration-300"
              >
                Subir factura
              </button>
            )}
          </div>
        </section>

        {/* Modales de subida */}
        <SubirArchivo
          open={mostrarSubirFactura}
          onClose={() => setMostrarSubirFactura(false)}
          url={api(`/stock/${item.id}/archivo`)}
          label="Subir nueva factura"
          nombreCampo="archivo"
          onUploaded={cargarProducto}
        />
        <SubirArchivo
          open={mostrarSubirImagen}
          onClose={() => setMostrarSubirImagen(false)}
          url={api(`/stock/${item.id}/imagen`)}
          label="Subir nueva imagen"
          nombreCampo="imagen"
          onUploaded={cargarProducto}
        />
      </div>
    </main>
  </div>
);

}
