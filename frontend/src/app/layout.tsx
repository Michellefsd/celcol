import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import AuthEntry from '@/components/AuthEntry';
import AppFrame from '@/components/AppFrame';

export const metadata: Metadata = {
  title: 'Celcol | Gestión aeronáutica',
  description: 'Sistema de gestión técnica para talleres de aviación',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-[#2C2C2C] font-sans">
        <AuthProvider>
            <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}

