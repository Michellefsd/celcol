'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SubirArchivo from '@/components/Asignaciones/SubirArchivo';

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
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const [item, setItem] = useState<StockItem | null>(null);
  const [mostrarSubirFactura, setMostrarSubirFactura] = useState(false);
  const [mostrarSubirImagen, setMostrarSubirImagen] = useState(false);

useEffect(() => {
  if (!id) return;

  fetch(`http://localhost:3001/stock/${id}`)
    .then((res) => res.json())
    .then((data) => {
      console.log('🧾 Datos del item cargado:', data);
      setItem({
        ...data,
        archivoFactura: data.archivo, // Reasignamos para que se muestre correctamente
      });
    })
    .catch((err) => console.error('Error al cargar el producto de stock:', err));
}, [id]);


  if (!item) return <p className="text-gray-500">Cargando producto...</p>;

  return (
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

        {item.imagen && (
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
        )}

        {!item.imagen && (
          <div className="pt-4">
            <button
              onClick={() => setMostrarSubirImagen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Subir imagen
            </button>
          </div>
        )}

        {item.archivoFactura && (
          <div className="pt-4 space-y-2">
            <h2 className="font-semibold">Factura</h2>

            <div className="flex flex-wrap gap-4 mt-2">
              <a
                href={item.archivoFactura}
                target="_blank"
                rel="noopener noreferrer" 
                className="bg-gray-100 text-blue-600 px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-200 transition"
              >
                Ver factura
              </a>

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
        )}

        {!item.archivoFactura && (
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
        url={`http://localhost:3001/stock/${item.id}/archivo`}
        label="Subir nueva factura"
        nombreCampo="archivo"
        onUploaded={() => {
          fetch(`http://localhost:3001/stock/${item.id}`)
            .then((res) => res.json())
            .then((data) => setItem(data));
        }}
      />

      <SubirArchivo
        open={mostrarSubirImagen}
        onClose={() => setMostrarSubirImagen(false)}
        url={`http://localhost:3001/stock/${item.id}/imagen`}
        label="Subir nueva imagen"
        nombreCampo="imagen"
        onUploaded={() => {
          fetch(`http://localhost:3001/stock/${item.id}`)
            .then((res) => res.json())
            .then((data) => setItem(data));
        }}
      />
    </div>
  );
}
