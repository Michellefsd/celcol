'use client';

import { useState } from 'react';
import CrudManager from '@/components/CrudManager';
import AgregarStockModal from '@/components/Asignaciones/AsignarStock';

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
  precioVenta?: number;
  coste?: number;
  unidadMedida?: string;
  cantidad: number;
  stockMinimo: number;
  fechaIngreso?: string;
  imagen?: string;
  archivoFactura?: string;
};

export default function StockPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [refrescar, setRefrescar] = useState(false);

  // Aunque no se use, CrudManager lo requiere
  const formFields: never[] = [];

  return (
    <>
      <CrudManager<StockItem>
  title="Productos de Stock"
  endpoint="http://localhost:3001/stock"
  columns={[
    'id',
    'imagen',
    'nombre',
    'marca',
    'modelo',
    'cantidad',
    'stockMinimo',
    'puedeSerVendido',
    'puedeSerComprado',
  ]}
  formFields={formFields}
  onBeforeSubmit={(form) => {
    if (!form || !('id' in form)) {
      setModalAbierto(true);
      return 'cancelar-envío';
    }
    return null;
  }}
  onAfterCreate={() => setRefrescar(!refrescar)}
  extraActions={(item) =>
    item.imagen ? (
      <img
        src={`http://localhost:3001/${item.imagen}`}
        alt="imagen"
        className="w-12 h-12 object-contain border rounded"
      />
    ) : (
      <span className="text-xs text-gray-400">Sin imagen</span>
    )
  }
/>


      <AgregarStockModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSaved={() => {
          setRefrescar(!refrescar);
          setModalAbierto(false);
        }}
      />
    </>
  );
}
