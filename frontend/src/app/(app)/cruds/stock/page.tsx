'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CrudManager, { Field } from '@/components/CrudManager';
import { api, fetchJson } from '@/services/api';
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
  imagen?: ArchivoRef | null;      // ← antes era string
  archivoFactura?: string;         // (puede quedar igual)
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

// cache simple en memoria para no pedir mil veces la misma URL
const presignCache = new Map<string, string>();

async function obtenerUrlFirmada(key: string, disposition: 'inline' | 'attachment') {
  const q = new URLSearchParams({ key, disposition }).toString();
  return fetchJson<{ url: string }>(`/archivos/url-firmada?${q}`);
}

export default function StockPage() {
  const router = useRouter();

// 1) estado local para URLs de miniaturas
const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

// 2) helper que presigna y actualiza estado (dispara re-render)
async function getThumbUrl(storageKey: string) {
  // si ya está en estado, devolvémosla
  if (thumbUrls[storageKey]) return thumbUrls[storageKey];

  try {
    const { url } = await obtenerUrlFirmada(storageKey, 'inline'); // ← tu función
    if (url) {
      setThumbUrls(prev => ({ ...prev, [storageKey]: url })); // ← 🔁 re-render
      return url;
    }
  } catch (e) {
    console.error('No se pudo presignar miniatura', e);
  }
  return '';
}

  const rowClassName = (item: StockItem) => {
    if (item.cantidad === 0) return 'bg-rose-50';        // agotado
    if (item.cantidad <= item.stockMinimo) return 'bg-amber-50'; // alerta
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        <CrudManager<StockItem>
  title="Productos de Stock"
  endpoint={api('/stock')}
  columns={[
    'imagen', // ← miniatura primero
    'id','tipoProducto','nombre','marca','modelo','numeroSerie','notasInternas',
    'cantidad','stockMinimo','puedeSerVendido','puedeSerComprado',
    'codigoBarras','fechaIngreso','precioVenta','coste','unidadMedida',
  ]}
  columnLabels={{
    imagen: ' ', // encabezado vacío (o "Imagen")
  }}
  formFields={formFields}
  rowClassName={rowClassName}
renderCell={(key, item) => {
  if (key !== 'imagen') return undefined;

  const ref = item.imagen;
  const go = () => router.push(`/cruds/stock/${item.id}`);

  // 1) si ya hay url pública, úsala
  if (ref?.urlPublica) {
    return (
      <button type="button" onClick={go} title="Ver detalle" className="inline-block">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
          <img src={ref.urlPublica} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      </button>
    );
  }

  // 2) si hay storageKey, mirar estado; si no está, disparar carga y mostrar placeholder
  if (ref?.storageKey) {
    const cached = thumbUrls[ref.storageKey];

    if (!cached) {
      // disparar en segundo plano (no bloquea render)
      getThumbUrl(ref.storageKey);
      return (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center text-slate-400 text-xs">
          🖼️
        </div>
      );
    }

    // ya tenemos URL firmada en estado
    return (
      <button type="button" onClick={go} title="Ver detalle" className="inline-block">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
          <img src={cached} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      </button>
    );
  }

  // 3) sin imagen
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
