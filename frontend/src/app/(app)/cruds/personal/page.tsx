'use client';

import CrudManager from '@/components/CrudManager';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import IconButton from '@/components/IconButton';
import { IconVer } from '@/components/ui/Icons';

type Empleado = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  esCertificador: boolean;
  esTecnico: boolean;
  direccion: string;
  tipoLicencia: string[];
  numeroLicencia: string;
  vencimientoLicencia: string;
  fechaAlta: string;
  horasTrabajadas: number;
};


export default function EmpleadosPage() {
  const router = useRouter();

  const rowClassName = (e: Empleado) => {
    if (!e.vencimientoLicencia) return '';
    const hoy = new Date();
    const fv = new Date(e.vencimientoLicencia);
    const diff = Math.ceil((fv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return '';
    if (diff < 0) return 'bg-rose-50';
    if (diff <= 30) return 'bg-amber-50';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full lg:w-[80%] max-w-[1800px] px-4 md:px-6 lg:px-8 py-6">
        <CrudManager<Empleado>
          title="Personal"
          endpoint={api('/personal')}
          columns={[
            'nombre','apellido','telefono','email','esCertificador','esTecnico',
            'direccion','tipoLicencia','numeroLicencia','vencimientoLicencia','fechaAlta','horasTrabajadas'
          ]}
          formFields={[
            { name: 'nombre', label: 'Nombre', type: 'text', required: true },
            { name: 'apellido', label: 'Apellido', type: 'text', required: true },
            { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'esCertificador', label: '¿Es certificador?', type: 'checkbox' },
            { name: 'esTecnico', label: '¿Es técnico?', type: 'checkbox' },
            { name: 'direccion', label: 'Dirección', type: 'text' },
            { name: 'tipoLicencia', label: 'Tipo de Licencia', type: 'select', multiple: true, options: [
              { value: 'MOTOR', label: 'Motor' },
              { value: 'AVIONICA', label: 'Aviónica' },
              { value: 'AERONAVE', label: 'Aeronave' },
            ], required: true },
            { name: 'numeroLicencia', label: 'Número de Licencia', type: 'text' },
            { name: 'vencimientoLicencia', label: 'Vencimiento de Licencia', type: 'date' },
            { name: 'fechaAlta', label: 'Fecha de Alta', type: 'date' },
          ]}
          rowClassName={rowClassName}
          extraActions={(empleado) => (
            <IconButton
              icon={IconVer}
              title="Ver detalle"
              className="text-cyan-600 hover:text-cyan-800"
              onClick={() => router.push(`/cruds/personal/${empleado.id}`)}
            />
          )}
        />
      </main>
    </div>
  );
}

