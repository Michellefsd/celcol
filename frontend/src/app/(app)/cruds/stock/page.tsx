'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CrudManager, { Field } from '@/components/CrudManager';
import { api } from '@/services/api';
import IconButton from '@/components/IconButton';
import { IconVer } from '@/components/ui/Icons';

type ArchivoRef = {
  id: number;
  storageKey: string;
  mime?: string | null;
  originalName?: string | null;
  sizeAlmacen?: number | null;
  urlPublica?: string | null;
};

type StockItem = {
  id: number;
  nombre: string;
  tipoProducto?: string;
  codigoBarras?: string;
  notasInternas?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  puedeSerVendido: boolean;
  puedeSerComprado: boolean;
  precioVenta: number;
  coste: number;
  unidadMedida?: string;
  cantidad: number;
  stockMinimo: number;
  fechaIngreso: string;
  imagen?: ArchivoRef | null;
  archivoFactura?: string;
};

const formFields: Field[] = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'tipoProducto', label: 'Tipo de producto', type: 'text' },
  { name: 'codigoBarras', label: 'Código de barras', type: 'text' },
  { name: 'notasInternas', label: 'Notas internas', type: 'text' },
  { name: 'marca', label: 'Marca', type: 'text' },
  { name: 'modelo', label: 'Modelo', type: 'text' },
  { name: 'numeroSerie', label: 'Número de serie', type: 'text' },
  { name: 'puedeSerVendido', label: 'Puede ser vendido', type: 'checkbox' },
  { name: 'puedeSerComprado', label: 'Puede ser comprado', type: 'checkbox' },
  { name: 'precioVenta', label: 'Precio de venta', type: 'number' },
  { name: 'coste', label: 'Coste', type: 'number' },
  { name: 'unidadMedida', label: 'Unidad de medida', type: 'text' },
  { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
  { name: 'stockMinimo', label: 'Stock mínimo', type: 'number', required: true },
  { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
];


export default function StockPage() {
  const router = useRouter();

  // URLs firmadas por storageKey para miniaturas
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  // Presigna una URL y actualiza estado (dispara re-render)
  async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
    const q = new URLSearchParams({ key, disposition }).toString();
    const res = await fetch(api(`/archivos/url-firmada?${q}`), {
      credentials: 'include', // quitalo si tu endpoint no usa cookie
    });
    if (!res.ok) throw new Error(`Presign ${res.status}`);
    return (await res.json()) as { url: string };
  }

  async function getThumbUrl(storageKey: string) {
    const cached = thumbUrls[storageKey];
    if (cached) return cached;
    try {
      const { url } = await obtenerUrlFirmada(storageKey, 'inline');
      if (url) {
        setThumbUrls(prev => ({ ...prev, [storageKey]: url }));
        return url;
      }
    } catch (e) {
      console.error('No se pudo presignar miniatura', e);
    }
    return '';
  }

  const rowClassName = (item: StockItem) => {
    if (item.cantidad === 0) return 'bg-rose-50';
    if (item.cantidad <= item.stockMinimo) return 'bg-amber-50';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        <CrudManager<StockItem>
          title="Productos de Stock"
          endpoint={api('/stock')}
          columns={[
            'imagen',
            'id', 'tipoProducto', 'nombre', 'marca', 'modelo', 'numeroSerie', 'notasInternas',
            'cantidad', 'stockMinimo', 'puedeSerVendido', 'puedeSerComprado',
            'codigoBarras', 'fechaIngreso', 'precioVenta', 'coste', 'unidadMedida',
          ]}
          columnLabels={{ imagen: ' ' }}
          formFields={formFields}
          rowClassName={rowClassName}
          renderCell={(key, item) => {
            if (key !== 'imagen') return undefined;

            const ref = item.imagen;
            const go = () => router.push(`/cruds/stock/${item.id}`);

            // si el backend ya expone URL pública
            if (ref?.urlPublica) {
              return (
                <button type="button" onClick={go} title="Ver detalle" className="inline-block">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={ref.urlPublica} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                </button>
              );
            }

            // si no es imagen (ej: PDF), mostrar ícono
            if (ref?.mime && !ref.mime.startsWith('image/')) {
              return (
                <div
                  className="w-12 h-12 rounded-md overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center text-slate-500 text-xs"
                  title={ref.mime || 'archivo'}
                >
                  📄
                </div>
              );
            }

            if (ref?.storageKey) {
              const cached = thumbUrls[ref.storageKey];

              if (!cached) {
                // dispara la carga en segundo plano; se verá el placeholder hasta que llegue
                getThumbUrl(ref.storageKey);
                return (
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center text-slate-400 text-xs">
                    🖼️
                  </div>
                );
              }

              return (
                <button type="button" onClick={go} title="Ver detalle" className="inline-block">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={cached} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                </button>
              );
            }

            // sin imagen
            return (
              <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center text-slate-400 text-xs">
                —
              </div>
            );
          }}
          extraActions={(stock) => (
            <IconButton
              icon={IconVer}
              title="Ver detalle"
              className="text-cyan-600 hover:text-cyan-800"
              onClick={() => router.push(`/cruds/stock/${stock.id}`)}
            />
          )}
        />
      </main>
    </div>
  );
}
