// frontend/src/app/(app)/layout.tsx
'use client';

import type { ReactNode } from 'react';
import AppFrame from '@/components/AppFrame';
import { AuthProvider } from '@/context/AuthContext'; // ← ajustá si tu export es default

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppFrame>{children}</AppFrame>
    </AuthProvider>
  );
}
