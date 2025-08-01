'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/services/api';
import Link from 'next/link';

export default function AvisosIcon() {
  const [noLeidos, setNoLeidos] = useState(0);

  useEffect(() => {
    fetch(api('/avisos'))
      .then((res) => res.json())
      .then((avisos) => {
        const cantidad = avisos.filter((a: any) => !a.leido).length;
        setNoLeidos(cantidad);
      })
      .catch(() => setNoLeidos(0));
  }, []);

  return (
    <Link href="/avisos" className="relative p-2 hover:bg-gray-100 rounded transition">
      <Bell className="w-6 h-6 text-gray-800" />

      {noLeidos > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center leading-none shadow-md">
          {noLeidos}
        </span>
      )}
    </Link>
  );
}
