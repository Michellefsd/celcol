'use client';

import { useState } from 'react';

export default function AgregarMotorModal({ avionId, onClose, onSaved }: {
  avionId: number;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    numeroSerie: '',
    TSN: '',
    TSO: '',
    TBOFecha: '',
    TBOHoras: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const body = {
      marca: formData.marca,
      modelo: formData.modelo,
      numeroSerie: formData.numeroSerie,
      TSN: formData.TSN ? parseFloat(formData.TSN) : null,
      TSO: formData.TSO ? parseFloat(formData.TSO) : null,
      TBOFecha: formData.TBOFecha ? new Date(formData.TBOFecha) : null,
      TBOHoras: formData.TBOHoras ? parseFloat(formData.TBOHoras) : null,
      avionId
    };
    await fetch('http://localhost:3001/motores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
        <h2 className="text-xl font-semibold">Agregar Motor</h2>
        {['marca', 'modelo', 'numeroSerie', 'TSN', 'TSO', 'TBOFecha', 'TBOHoras'].map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-sm capitalize">{field}</label>
            <input
              type={field.includes('Fecha') ? 'date' : 'text'}
              name={field}
              value={formData[field as keyof typeof formData]}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
}
