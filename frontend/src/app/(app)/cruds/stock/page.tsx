'use client';

import { useRouter } from 'next/navigation';
import CrudManager, { Field } from '@/components/CrudManager';
import { api, fetchJson } from '@/services/api';
import IconButton from '@/components/IconButton';
import { IconVer } from '@/components/ui/Icons';

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
  imagen?: string;
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
            'id','tipoProducto','nombre','marca','modelo','numeroSerie','notasInternas',
            'cantidad','stockMinimo','puedeSerVendido','puedeSerComprado',
            'codigoBarras','fechaIngreso','precioVenta','coste','unidadMedida',
          ]}
          formFields={formFields}
          rowClassName={rowClassName}
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
