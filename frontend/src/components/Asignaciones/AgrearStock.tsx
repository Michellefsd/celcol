'use client';

import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function AgregarStockModal({ open, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipoProducto: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    cantidad: '',
    precioVenta: '',
    coste: '',
    fechaIngreso: '',
    puedeSerVendido: false,
    puedeSerComprado: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const body = {
      nombre: formData.nombre,
      tipoProducto: formData.tipoProducto || undefined,
      marca: formData.marca || undefined,
      modelo: formData.modelo || undefined,
      numeroSerie: formData.numeroSerie || undefined,
      cantidad: parseInt(formData.cantidad),
      precioVenta: parseFloat(formData.precioVenta),
      coste: parseFloat(formData.coste),
      fechaIngreso: formData.fechaIngreso || undefined,
      puedeSerVendido: formData.puedeSerVendido,
      puedeSerComprado: formData.puedeSerComprado,
    };

    const res = await fetch('http://localhost:3001/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSaved?.();
      onClose();
    }
  };

  if (!open) return null;

  const inputs: [keyof typeof formData, string][] = [
    ['nombre', 'Nombre'],
    ['tipoProducto', 'Tipo de producto'],
    ['marca', 'Marca'],
    ['modelo', 'Modelo'],
    ['numeroSerie', 'Número de serie'],
    ['cantidad', 'Cantidad'],
    ['precioVenta', 'Precio de venta'],
    ['coste', 'Coste'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
        <h2 className="text-xl font-semibold">Agregar producto de stock</h2>

        {inputs.map(([name, label]) => (
          <div key={name}>
            <label className="text-sm">{label}</label>
            <input
              name={name}
              type={['cantidad', 'precioVenta', 'coste'].includes(name) ? 'number' : 'text'}
              value={formData[name] as string}
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

        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
