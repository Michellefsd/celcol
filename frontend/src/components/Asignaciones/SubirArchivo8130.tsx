'use client';
import { useState } from 'react';
import { api, apiFetch } from '@/services/api';

type Props = {
  componenteId: number;
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
};

export default function SubirArchivo8130Modal({
  componenteId,
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
      // 👇 Usa apiFetch para que mande cookies y refresque en 401
      await apiFetch(api(`/componentes/${componenteId}/archivo8130`), {
        method: 'POST',
        body: formData, // no seteamos Content-Type (lo pone el navegador)
      });

      if (onUploaded) onUploaded();
      onClose();
   } catch (err: any) {
      if (err?.status === 401) {
        // opcional: redirigir si falló el refresh
        // router.push('/login');
      }
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
        <h2 className="text-xl font-bold mb-4">Subir archivo 8130</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            setArchivo(e.target.files?.[0] || null);
            setError('');
          }}
          className="mb-4"
          disabled={subiendo}
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
