'use client';

import React from 'react';

interface AccionBotonProps {
  label: string;
  color?: 'blue' | 'red' | 'gray';
  onClick: () => void;
}

export default function AccionBoton({ label, color = 'gray', onClick }: AccionBotonProps) {
  const colorClasses = {
    blue: 'text-blue-600 hover:text-blue-800',
    red: 'text-red-600 hover:text-red-800',
    gray: 'text-gray-700 hover:text-black'
  };

  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium underline underline-offset-2 ${colorClasses[color]}`}
    >
      {label}
    </button>
  );
}
