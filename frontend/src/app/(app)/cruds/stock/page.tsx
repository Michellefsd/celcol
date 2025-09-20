'use client';

import { useRouter } from 'next/navigation';
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

    // 1) si ya tenemos url pública, usarla
    if (ref?.urlPublica) {
      return (
        <button type="button" onClick={go} title="Ver detalle" className="inline-block">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
            <img src={ref.urlPublica} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        </button>
      );
    }

    // 2) si no hay url, intentar presignar UNA vez por key
    if (ref?.storageKey) {
      const cached = presignCache.get(ref.storageKey);
      if (cached) {
        return (
          <button type="button" onClick={go} title="Ver detalle" className="inline-block">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
              <img src={cached} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
          </button>
        );
      }

      // ⚠️ Render inicial: placeholder y disparamos la obtención asíncrona
      // (Cuando llegue la URL, la fila se re-renderiza por React state del CrudManager; si no,
      // podés forzar un setState arriba, pero en tablas grandes conviene que el backend mande urlPublica.)
      obtenerUrlFirmada(ref.storageKey, 'inline').then(({ url }) => {
        if (url) {
          presignCache.set(ref.storageKey!, url);
          // no tenemos setState acá; si querés re-render inmediato,
          // podés llevar este caché a un useState/useReducer en la página
          // o mejor: que el backend devuelva urlPublica en el listado.
        }
      }).catch(() => { /* noop */ });

      return (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center text-slate-400 text-xs">
          🖼️
        </div>
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
