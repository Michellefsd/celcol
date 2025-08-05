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

  return (
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
}
