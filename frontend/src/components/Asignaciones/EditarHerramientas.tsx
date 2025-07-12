'use client';

import { useEffect, useState, ChangeEvent } from 'react';

interface Herramienta {
  id: number;
  nombre: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  herramienta: Herramienta | null;
}

export default function EditarHerramientaModal({ open, onClose, onSaved, herramienta }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    fechaIngreso: '',
    fechaVencimiento: '',
  });
  const [certificadoCalibracion, setCertificadoCalibracion] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (herramienta) {
      setForm({
        nombre: herramienta.nombre || '',
        tipo: herramienta.tipo || '',
        marca: herramienta.marca || '',
        modelo: herramienta.modelo || '',
        numeroSerie: herramienta.numeroSerie || '',
        fechaIngreso: herramienta.fechaIngreso?.substring(0, 10) || '',
        fechaVencimiento: herramienta.fechaVencimiento?.substring(0, 10) || '',
      });
    }
  }, [herramienta]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!herramienta) return;
    if (!form.nombre) {
      setError('El campo "nombre" es obligatorio');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (certificadoCalibracion) {
      formData.append('certificadoCalibracion', certificadoCalibracion);
    }

    try {
      const res = await fetch(`http://localhost:3001/herramientas/${herramienta.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      onSaved?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!open || !herramienta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-3">
        <h2 className="text-xl font-semibold">Editar herramienta #{herramienta.id}</h2>

        <div className="space-y-2">
          <input className="input" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
          <input className="input" name="tipo" placeholder="Tipo" value={form.tipo} onChange={handleChange} />
          <input className="input" name="marca" placeholder="Marca" value={form.marca} onChange={handleChange} />
          <input className="input" name="modelo" placeholder="Modelo" value={form.modelo} onChange={handleChange} />
          <input className="input" name="numeroSerie" placeholder="Número de serie" value={form.numeroSerie} onChange={handleChange} />
          <input className="input" name="fechaIngreso" type="date" value={form.fechaIngreso} onChange={handleChange} />
          <input className="input" name="fechaVencimiento" type="date" value={form.fechaVencimiento} onChange={handleChange} />

          <label className="block text-sm font-medium">Nuevo certificado de calibración (PDF)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setCertificadoCalibracion(e.target.files?.[0] || null)} />

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
