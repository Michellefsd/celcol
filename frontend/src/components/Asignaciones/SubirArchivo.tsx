'use client';

import { useState } from 'react';

type Props = {
  modelo: string; // ejemplo: 'stock', 'personal', 'herramientas'
  campo: string;  // ejemplo: 'archivoFactura', 'carneDeSalud'
  id: number;
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
};

export default function SubirArchivoModal({
  modelo,
  campo,
  id,
  open,
  onClose,
  onUploaded,
}: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const handleSubmit = async () => {
    if (!archivo) {
      setError('Seleccioná un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      setSubiendo(true);
      const res = await fetch(`/api/${modelo}/${id}/${campo}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir el archivo');

      onUploaded?.();
      onClose();
    } catch (err) {
      setError('Hubo un problema al subir el archivo.');
      console.error(err);
    } finally {
      setSubiendo(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          Subir archivo: <span className="text-gray-700">{campo}</span>
        </h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          className="mb-4"
        />

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
            disabled={subiendo}
          >
            {subiendo ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
}
