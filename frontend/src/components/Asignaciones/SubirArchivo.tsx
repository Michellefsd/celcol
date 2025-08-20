'use client';
import { useState } from 'react';
import { apiFetch } from '@/services/api';


type Props = {
  url: string; // endpoint al que enviar el archivo
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
  label?: string;
  nombreCampo?: string; // 👈 nuevo prop para definir el nombre del campo
};

export default function SubirArchivo({
  url,
  open,
  onClose,
  onUploaded,
  label = 'Seleccioná un archivo',
  nombreCampo = 'archivo', // 👈 por defecto usa "archivo"
}: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!archivo) {
      setError('Debés seleccionar un archivo');
      return;
    }

    const formData = new FormData();
    formData.append(nombreCampo, archivo); // 👈 ahora usa el nombre configurable

    try {
      setSubiendo(true);
      await apiFetch(url, {
        method: 'POST',
        body: formData, // ✅ NO setear Content-Type; lo maneja el helper
      });
 
      if (onUploaded) onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">{label}</h2>
        <input
          type="file"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          className="mb-4"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={subiendo}
          >
            {subiendo ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
}
