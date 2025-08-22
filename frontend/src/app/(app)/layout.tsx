'use client';
// NO importes './globals.css' aquí

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import AppFrame from '@/components/AppFrame';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppFrame>{children}</AppFrame>
    </AuthProvider>
  );
}
