import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Celcol | Gestión aeronáutica',
  description: 'Sistema de gestión técnica para talleres de aviación',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#FAFAFA] text-[#2C2C2C] font-sans">
        <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center gap-4">
          <Image src="/celcol-logo.webp" alt="Logo Celcol" width={120} height={120} />
          <h1 className="text-lg font-semibold tracking-tight">
            Celcol | Gestión aeronáutica
          </h1>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
