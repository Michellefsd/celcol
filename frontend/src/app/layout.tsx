/*import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import AvisosIcon from '@/components/AvisosIcon';

export const metadata: Metadata = {
  title: 'Celcol | Gestión aeronáutica',
  description: 'Sistema de gestión técnica para talleres de aviación',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-[#2C2C2C] font-sans">
        <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src="/celcol-logo.webp" alt="Logo Celcol" width={140} height={112} />
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">
              Celcol | Gestión aeronáutica
            </h1>
          </div>

          <AvisosIcon />
        </header>

       <main className="w-full lg:w-[80%] max-w-[1800px] mx-auto px-6 py-8">
        {children}
      </main>
      </body>
    </html>
  );
}
  */

import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import AuthGate from '@/components/AuthGate';
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
          <AuthGate>
            <AppFrame>{children}</AppFrame>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}

