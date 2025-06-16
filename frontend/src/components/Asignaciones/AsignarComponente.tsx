'use client';

import { ChangeEvent, useState } from 'react';

interface Props {
  propietarioId: number;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AgregarComponenteModal({
  propietarioId,
  open,
  onClose,
  onSaved,
}: Props) {
  /* ─── estado ────────────────────────────────────────────────────────── */
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [manualPdf, setManualPdf] = useState<File | null>(null);
  const [error, setError] = useState('');

  /* ─── handlers ──────────────────────────────────────────────────────── */
  const handleFile = (e: ChangeEvent<HTMLInputElement>) =>
    setManualPdf(e.target.files?.[0] ?? null);

  const guardar = async () => {
    if (!marca || !modelo || !numeroSerie) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const body = new FormData();
      body.append('propietarioId', propietarioId.toString());
      body.append('marca', marca);
      body.append('modelo', modelo);
      body.append('numeroSerie', numeroSerie);
      if (manualPdf) body.append('manualPdf', manualPdf);

      const res = await fetch('http://localhost:3001/componentes', {
        method: 'POST',
        body,
      });
      if (!res.ok) throw new Error('No se pudo guardar');

      onSaved?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  /* ─── render ────────────────────────────────────────────────────────── */
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Agregar componente</h2>

        <div className="space-y-3">
          <input className="input" placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          <input className="input" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          <input className="input" placeholder="Número de serie" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
          <input type="file" accept="application/pdf" onChange={handleFile} />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
