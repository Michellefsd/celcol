'use client';

import { ChangeEvent, useEffect, useState } from 'react';

interface Componente {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie: string;
  manualPdfUrl?: string;
}

interface Props {
  componente: Componente | null;  // null mientras se carga
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditarComponenteModal({
  componente,
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

  /* ─── precarga ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (componente) {
      setMarca(componente.marca);
      setModelo(componente.modelo);
      setNumeroSerie(componente.numeroSerie);
    }
  }, [componente]);

  /* ─── handlers ──────────────────────────────────────────────────────── */
  const handleFile = (e: ChangeEvent<HTMLInputElement>) =>
    setManualPdf(e.target.files?.[0] ?? null);

  const actualizar = async () => {
    if (!componente) return;
    if (!marca || !modelo || !numeroSerie) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const body = new FormData();
      body.append('marca', marca);
      body.append('modelo', modelo);
      body.append('numeroSerie', numeroSerie);
      if (manualPdf) body.append('manualPdf', manualPdf);

      const res = await fetch(`http://localhost:3001/componentes/${componente.id}`, {
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

  /* ─── render ────────────────────────────────────────────────────────── */
  if (!open || !componente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">
          Editar componente #{componente.id}
        </h2>

        <div className="space-y-3">
          <input className="input" placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          <input className="input" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          <input className="input" placeholder="Número de serie" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
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
