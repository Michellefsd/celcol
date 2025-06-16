'use client';

import { ChangeEvent, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AgregarHerramientaModal({
  open,
  onClose,
  onSaved,
}: Props) {
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

  const handleFile = (e: ChangeEvent<HTMLInputElement>) =>
    setArchivo8130(e.target.files?.[0] ?? null);

  const guardar = async () => {
    if (!nombre || !tipo || !marca || !modelo) {
      setError('Faltan campos obligatorios');
      return;
    }

    try {
      const form = new FormData();
      form.append('nombre', nombre);
      form.append('tipo', tipo);
      form.append('marca', marca);
      form.append('modelo', modelo);
      form.append('numeroSerie', numeroSerie);
      form.append('fechaIngreso', fechaIngreso);
      form.append('fechaVencimiento', fechaVencimiento);
      form.append('certificadoCalibracion', certificadoCalibracion);
      if (archivo8130) form.append('archivo8130', archivo8130);

      const res = await fetch('http://localhost:3001/herramientas', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Error al guardar');

      onSaved?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-semibold">Agregar herramienta</h2>
        <div className="space-y-2">
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
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
