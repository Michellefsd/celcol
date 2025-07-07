'use client';

import { ChangeEvent, useEffect, useState } from 'react';

interface Componente {
  id: number;
  tipo?: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  numeroParte?: string;
  TSN?: number;
  TSO?: number;
  TBOHoras?: number;
  TBOFecha?: string;
  archivo8130?: string;
}

interface Props {
  componente: Componente | null;
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
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [numeroParte, setNumeroParte] = useState('');
  const [TSN, setTSN] = useState('');
  const [TSO, setTSO] = useState('');
  const [TBOHoras, setTBOHoras] = useState('');
  const [TBOFecha, setTBOFecha] = useState('');
  const [archivo8130, setArchivo8130] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (componente) {
      setTipo(componente.tipo ?? '');
      setMarca(componente.marca);
      setModelo(componente.modelo);
      setNumeroSerie(componente.numeroSerie);
      setNumeroParte(componente.numeroParte ?? '');
      setTSN(componente.TSN?.toString() ?? '');
      setTSO(componente.TSO?.toString() ?? '');
      setTBOHoras(componente.TBOHoras?.toString() ?? '');
      setTBOFecha(componente.TBOFecha?.slice(0, 10) ?? '');
    }
  }, [componente]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) =>
    setArchivo8130(e.target.files?.[0] ?? null);

  const actualizar = async () => {
    if (!componente) return;
    if (!marca || !modelo || !numeroSerie) {
      setError('Marca, modelo y número de serie son obligatorios');
      return;
    }

    try {
      const body = new FormData();
      body.append('marca', marca);
      body.append('modelo', modelo);
      body.append('numeroSerie', numeroSerie);
      if (tipo) body.append('tipo', tipo);
      if (numeroParte) body.append('numeroParte', numeroParte);
      if (TSN) body.append('TSN', TSN);
      if (TSO) body.append('TSO', TSO);
      if (TBOHoras) body.append('TBOHoras', TBOHoras);
      if (TBOFecha) body.append('TBOFecha', TBOFecha);
      if (archivo8130) body.append('archivo8130', archivo8130);

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

  if (!open || !componente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Editar componente #{componente.id}</h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      
        <input className="input" placeholder="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} />
        <input className="input" placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
        <input className="input" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
        <input className="input" placeholder="Número de serie" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
        <input className="input" placeholder="Número de parte (opcional)" value={numeroParte} onChange={(e) => setNumeroParte(e.target.value)} />
        <input className="input" type="number" placeholder="TSN (horas)" value={TSN} onChange={(e) => setTSN(e.target.value)} />
        <input className="input" type="number" placeholder="TSO (horas)" value={TSO} onChange={(e) => setTSO(e.target.value)} />
        <input className="input" type="number" placeholder="TBO (horas)" value={TBOHoras} onChange={(e) => setTBOHoras(e.target.value)} />
        <input className="input" type="date" value={TBOFecha} onChange={(e) => setTBOFecha(e.target.value)} />
        <input type="file" accept="application/pdf" onChange={handleFile} />

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-300 rounded-lg" onClick={onClose}>
            Cancelar
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={actualizar}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
