'use client';

import { useState, useEffect } from 'react';

interface Helice {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie: string;
  TSN?: number | null;
  TSO?: number | null;
  TBOFecha?: string | null;
  TBOHoras?: number | null;
}

interface Props {
  helice: Helice;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditarHeliceModal({ helice, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    numeroSerie: '',
    TSN: '',
    TSO: '',
    TBOFecha: '',
    TBOHoras: ''
  });

  useEffect(() => {
    if (helice) {
      setFormData({
        marca: helice.marca || '',
        modelo: helice.modelo || '',
        numeroSerie: helice.numeroSerie || '',
        TSN: helice.TSN?.toString() || '',
        TSO: helice.TSO?.toString() || '',
        TBOFecha: helice.TBOFecha ? helice.TBOFecha.slice(0, 10) : '',
        TBOHoras: helice.TBOHoras?.toString() || ''
      });
    }
  }, [helice]);

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
      TBOHoras: formData.TBOHoras ? parseFloat(formData.TBOHoras) : null
    };
    await fetch(`http://localhost:3001/helices/${helice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Editar Hélice</h2>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
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
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-white sticky bottom-0 z-10">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}