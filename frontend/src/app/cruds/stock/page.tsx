'use client';

import { useState } from 'react';
import CrudManager, { Field } from '@/components/CrudManager';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; 

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
  { name: 'nombre', label: 'Nombre', type: 'text' },
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
  { name: 'cantidad', label: 'Cantidad', type: 'number' },
  { name: 'stockMinimo', label: 'Stock mínimo', type: 'number' },
  { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date' },
];

export default function StockPage() {
  const router = useRouter();

  return (
    <CrudManager<StockItem>
      title="Productos de Stock"
      endpoint={api("/stock")}
      columns={[
        'id',
        'tipoProducto',
        'nombre',
        'marca',
        'modelo',
        'numeroSerie',
        'notasInternas',
        'cantidad',
        'stockMinimo',
        'puedeSerVendido',
        'puedeSerComprado',
        'codigoBarras',
        'fechaIngreso',
        'precioVenta',
        'coste',
        'unidadMedida',
      ]}
      formFields={formFields}
      
      extraActions={(stock) => (
        <button
          onClick={() => router.push(`/cruds/stock/${stock.id}`)}
          title="Ver detalle"
          className="text-green-600 hover:text-green-800 text-sm"
        >
          👁
        </button>
      )}
    />
  );
}
