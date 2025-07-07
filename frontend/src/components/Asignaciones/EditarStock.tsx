'use client';

import { useEffect, useState, ChangeEvent } from 'react';

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

type Props = {
  open: boolean;
  stock: StockItem | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function EditarStockModal({ open, stock, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipoProducto: '',
    codigoBarras: '',
    notasInternas: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    puedeSerVendido: false,
    puedeSerComprado: false,
    precioVenta: '',
    coste: '',
    unidadMedida: '',
    cantidad: '',
    stockMinimo: '',
    fechaIngreso: '',
    imagen: null as File | null,
    archivoFactura: null as File | null,
  });

  useEffect(() => {
    if (stock) {
      setFormData({
        nombre: stock.nombre,
        tipoProducto: stock.tipoProducto ?? '',
        codigoBarras: stock.codigoBarras ?? '',
        notasInternas: stock.notasInternas ?? '',
        marca: stock.marca ?? '',
        modelo: stock.modelo ?? '',
        numeroSerie: stock.numeroSerie ?? '',
        puedeSerVendido: stock.puedeSerVendido,
        puedeSerComprado: stock.puedeSerComprado,
        precioVenta: stock.precioVenta.toString(),
        coste: stock.coste.toString(),
        unidadMedida: stock.unidadMedida ?? '',
        cantidad: stock.cantidad.toString(),
        stockMinimo: stock.stockMinimo.toString(),
        fechaIngreso: stock.fechaIngreso?.substring(0, 10) || '',
        imagen: null,
        archivoFactura: null,
      });
    }
  }, [stock]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value, checked, files } = e.target as any;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!stock) return;

    const data = new FormData();
    data.append('nombre', formData.nombre);
    if (formData.tipoProducto) data.append('tipoProducto', formData.tipoProducto);
    if (formData.codigoBarras) data.append('codigoBarras', formData.codigoBarras);
    if (formData.notasInternas) data.append('notasInternas', formData.notasInternas);
    if (formData.marca) data.append('marca', formData.marca);
    if (formData.modelo) data.append('modelo', formData.modelo);
    if (formData.numeroSerie) data.append('numeroSerie', formData.numeroSerie);
    data.append('puedeSerVendido', String(formData.puedeSerVendido));
    data.append('puedeSerComprado', String(formData.puedeSerComprado));
    data.append('precioVenta', formData.precioVenta);
    data.append('coste', formData.coste);
    if (formData.unidadMedida) data.append('unidadMedida', formData.unidadMedida);
    data.append('cantidad', formData.cantidad);
    data.append('stockMinimo', formData.stockMinimo);
    if (formData.fechaIngreso) data.append('fechaIngreso', formData.fechaIngreso);
    if (formData.imagen) data.append('imagen', formData.imagen);
    if (formData.archivoFactura) data.append('archivoFactura', formData.archivoFactura);

    const res = await fetch(`http://localhost:3001/stock/${stock.id}`, {
      method: 'PUT',
      body: data,
    });

    if (res.ok) {
      onSaved?.();
      onClose();
    }
  };

  if (!open || !stock) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
        <h2 className="text-xl font-semibold">Editar producto #{stock.id}</h2>

        {[
          ['nombre', 'Nombre'],
          ['tipoProducto', 'Tipo de producto'],
          ['codigoBarras', 'Código de barras'],
          ['notasInternas', 'Notas internas'],
          ['marca', 'Marca'],
          ['modelo', 'Modelo'],
          ['numeroSerie', 'Número de serie'],
          ['unidadMedida', 'Unidad de medida'],
          ['cantidad', 'Cantidad'],
          ['stockMinimo', 'Stock mínimo'],
          ['precioVenta', 'Precio de venta'],
          ['coste', 'Coste'],
        ].map(([name, label]) => (
          <div key={name}>
            <label className="text-sm">{label}</label>
            <input
              name={name}
              type={['cantidad', 'stockMinimo', 'precioVenta', 'coste'].includes(name) ? 'number' : 'text'}
              value={(formData as any)[name]}
              onChange={handleChange}
              className="input"
            />
          </div>
        ))}

        <div>
          <label className="text-sm">Fecha de ingreso</label>
          <input
            name="fechaIngreso"
            type="date"
            value={formData.fechaIngreso}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="puedeSerVendido"
              checked={formData.puedeSerVendido}
              onChange={handleChange}
            />
            Vendible
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="puedeSerComprado"
              checked={formData.puedeSerComprado}
              onChange={handleChange}
            />
            Comprable
          </label>
        </div>

        <div>
          <label className="text-sm">Imagen (reemplazar)</label>
          <input
            name="imagen"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="text-sm">Factura (reemplazar)</label>
          <input
            name="archivoFactura"
            type="file"
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
