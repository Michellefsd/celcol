import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'CELCOL',
  description: 'App',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-white text-slate-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
