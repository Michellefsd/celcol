'use client';

import { ChangeEvent, useEffect, useState } from 'react';

interface Herramienta {
  id: number;
  nombre: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  fechaIngreso?: string;
  fechaVencimiento?: string;
  certificadoCalibracion?: string;
  archivo8130?: string;
}

interface Props {
  herramienta: Herramienta | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditarHerramientaModal({ herramienta, open, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [certificadoCalibracion, setCertificadoCalibracion] = useState('');
  const [archivo8130, setArchivo8130] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (herramienta) {
      setNombre(herramienta.nombre);
      setTipo(herramienta.tipo);
      setMarca(herramienta.marca);
      setModelo(herramienta.modelo);
      setNumeroSerie(herramienta.numeroSerie || '');
      setFechaIngreso(herramienta.fechaIngreso?.substring(0, 10) || '');
      setFechaVencimiento(herramienta.fechaVencimiento?.substring(0, 10) || '');
      setCertificadoCalibracion(herramienta.certificadoCalibracion || '');
    }
  }, [herramienta]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setArchivo8130(e.target.files?.[0] ?? null);
  };

  const actualizar = async () => {
    if (!herramienta) return;
    if (!nombre || !tipo || !marca || !modelo) {
      setError('Campos obligatorios faltantes');
      return;
    }

    try {
      const body = new FormData();
      body.append('nombre', nombre);
      body.append('tipo', tipo);
      body.append('marca', marca);
      body.append('modelo', modelo);
      body.append('numeroSerie', numeroSerie);
      body.append('fechaIngreso', fechaIngreso);
      body.append('fechaVencimiento', fechaVencimiento);
      body.append('certificadoCalibracion', certificadoCalibracion);
      if (archivo8130) body.append('archivo8130', archivo8130);

      const res = await fetch(`http://localhost:3001/herramientas/${herramienta.id}`, {
        method: 'PUT',
        body,
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
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Editar herramienta #{herramienta.id}</h2>

        <div className="space-y-3">
          <input className="input" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input className="input" placeholder="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} />
          <input className="input" placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          <input className="input" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          <input className="input" placeholder="Número de serie" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
          <input className="input" type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
          <input className="input" type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
          <input className="input" placeholder="Certificado de calibración" value={certificadoCalibracion} onChange={(e) => setCertificadoCalibracion(e.target.value)} />
          <input type="file" accept="application/pdf" onChange={handleFile} />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={actualizar}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
