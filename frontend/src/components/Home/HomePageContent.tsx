'use client';

import TrabajoCard from './TrabajoCard';
import EntidadMenu from './EntidadMenu';
import BaseButton from '../BaseButton';
import { useRouter } from 'next/navigation';
import IconButton from '../IconButton'
import { IconDescargar } from '../ui/Icons';
import { api } from '@/services/api';

export default function HomePageContent() {
  const router = useRouter();

  const abrir = (ruta: string) => {
    const win = window.open('about:blank', '_blank');
    if (win) setTimeout(() => (win.location.href = ruta), 60);
    else window.open(ruta, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header con animación */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="relative mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 animate-fade-in">
              Sistema de Gestión Celcol
            </h1>
            <p className="text-slate-600 text-lg animate-fade-in-delay">
              Gestión integral de órdenes de trabajo y mantenimiento aeronáutico
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda */}
          <div className="space-y-6 lg:col-span-2 animate-slide-in-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <BaseButton 
                variant="primary" 
                onClick={() => router.push('/ordenes-trabajo/nueva')}
              >
                Nuevo trabajo
              </BaseButton>
              <BaseButton 
                variant="secondary" 
                onClick={() => router.push('/archivadas')}
              >
                📁 Archivados
              </BaseButton>
            </div>
            <TrabajoCard />
          </div>

          {/* Columna derecha */}
          <div className="space-y-6 animate-slide-in-right">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6 space-y-6 transform transition-all duration-300 hover:shadow-xl">
              <EntidadMenu />

              <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-slate-900">Plantillas en blanco</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Descarga plantillas editables con el logo de Celcol incluido
                </p>
                <div className="flex gap-3">
                  <IconButton
                    icon={IconDescargar}
                    title="CCM (en blanco)"
                    label="CCM"
                    onClick={() => abrir(api('/plantillas/ccm'))}
                    className="flex-1 transform transition-all duration-200 hover:scale-105 hover:shadow-md bg-white hover:bg-blue-50"
                  />
                  <IconButton
                    icon={IconDescargar}
                    title="PDF (en blanco)"
                    label="PDF"
                    onClick={() => abrir(api('/plantillas/pdf'))}
                    className="flex-1 transform transition-all duration-200 hover:scale-105 hover:shadow-md bg-white hover:bg-indigo-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 0.8s ease-out 0.2s both;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out 0.4s both;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
}
