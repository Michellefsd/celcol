'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function VolverAtras({ texto = 'Volver' }: { texto?: string }) {
  const router = useRouter();

  return (
    <div className="w-full">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
        style={{ marginLeft: '-3%' }}
      >
        <ArrowLeft size={58} />
        {texto}
      </button>
    </div>
  );
}
