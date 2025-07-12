'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AsignarHerramientasModal({ open, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    fechaIngreso: '',
    fechaVencimiento: '',
    certificadoCalibracion: null as File | null,
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, files } = e.target;

    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      setError('El campo "nombre" es obligatorio');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value as any);
    });

    const res = await fetch('http://localhost:3001/herramientas', {
      method: 'POST',
      body: data,
    });

    if (res.ok) {
      onSaved?.();
      onClose();
    } else {
      setError('Error al guardar');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
        <h2 className="text-xl font-semibold">Agregar herramienta</h2>

        <div className="space-y-2">
          <div>
            <label className="text-sm">Nombre</label>
            <input name="nombre" value={formData.nombre} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Tipo</label>
            <input name="tipo" value={formData.tipo} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Marca</label>
            <input name="marca" value={formData.marca} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Modelo</label>
            <input name="modelo" value={formData.modelo} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Número de serie</label>
            <input name="numeroSerie" value={formData.numeroSerie} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Fecha de ingreso</label>
            <input name="fechaIngreso" type="date" value={formData.fechaIngreso} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Fecha de vencimiento</label>
            <input name="fechaVencimiento" type="date" value={formData.fechaVencimiento} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm">Certificado de calibración (PDF)</label>
            <input name="certificadoCalibracion" type="file" accept="application/pdf" onChange={handleChange} className="input" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
