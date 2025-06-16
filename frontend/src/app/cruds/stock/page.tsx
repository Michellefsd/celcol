'use client';

import CrudManager, { Field } from '@/components/CrudManager';

type StockItem = {
  id: number;
  nombre: string;
  tipoProducto: string;
  informacionGeneral?: string;
  referenciaInterna?: string;
  codigoBarras?: string;
  tipoCodigoBarras?: string;
  notasInternas?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  puedeSerVendido: boolean;
  puedeSerComprado: boolean;
  precioVenta: number;
  coste: number;
  impuestoCliente?: string;
  unidadMedida?: string;
  unidadMedidaCompra?: string;
  cantidad: number;
  fechaIngreso: string;
};

const formFields: Field[] = [
  { name: 'nombre', label: 'Nombre', type: 'text' },
  { name: 'tipoProducto', label: 'Tipo de producto', type: 'text' },
  { name: 'informacionGeneral', label: 'Información general', type: 'text' },
  { name: 'referenciaInterna', label: 'Referencia interna', type: 'text' },
  { name: 'codigoBarras', label: 'Código de barras', type: 'text' },
  { name: 'tipoCodigoBarras', label: 'Tipo de código de barras', type: 'text' },
  { name: 'notasInternas', label: 'Notas internas', type: 'text' },
  { name: 'marca', label: 'Marca', type: 'text' },
  { name: 'modelo', label: 'Modelo', type: 'text' },
  { name: 'numeroSerie', label: 'Número de serie', type: 'text' },
  { name: 'puedeSerVendido', label: 'Puede ser vendido', type: 'checkbox' },
  { name: 'puedeSerComprado', label: 'Puede ser comprado', type: 'checkbox' },
  { name: 'precioVenta', label: 'Precio de venta', type: 'number' },
  { name: 'coste', label: 'Coste', type: 'number' },
  { name: 'impuestoCliente', label: 'Impuesto cliente', type: 'text' },
  { name: 'unidadMedida', label: 'Unidad de medida', type: 'text' },
  { name: 'unidadMedidaCompra', label: 'Unidad medida compra', type: 'text' },
  { name: 'cantidad', label: 'Cantidad', type: 'number' },
  { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
];

export default function StockPage() {
  return (
    <CrudManager<StockItem>
      title="Productos de Stock"
      endpoint="http://localhost:3001/stock"
      columns={['id', 'nombre', 'tipoProducto', 'marca', 'modelo', 'cantidad', 'puedeSerVendido', 'puedeSerComprado']}
      formFields={formFields}
    />
  );
}
