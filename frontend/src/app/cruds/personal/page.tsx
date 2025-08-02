'use client';

import CrudManager from '@/components/CrudManager';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; 

type Empleado = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  esCertificador: boolean;
  esTecnico: boolean;
  direccion: string;
  tipoLicencia: string;
  numeroLicencia: string;
  vencimientoLicencia: string;
  fechaAlta: string;
  horasTrabajadas: number;
};

export default function EmpleadosPage() {
  const router = useRouter();

  return (
    <CrudManager<Empleado>
      title="Personal"
      endpoint={api("/personal")}
      columns={[
        'nombre', 'apellido', 'telefono', 'email', 'esCertificador',
        'esTecnico', 'direccion', 'tipoLicencia', 'numeroLicencia',
        'vencimientoLicencia', 'fechaAlta', 'horasTrabajadas'
      ]}
      formFields={[
        { name: 'nombre', label: 'Nombre', type: 'text', required: true },
        { name: 'apellido', label: 'Apellido', type: 'text', required: true },
        { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'esCertificador', label: '¿Es certificador?', type: 'checkbox' },
        { name: 'esTecnico', label: '¿Es técnico?', type: 'checkbox' },
        { name: 'direccion', label: 'Dirección', type: 'text' },
        { name: 'tipoLicencia', label: 'Tipo de Licencia', type: 'text' },
        { name: 'numeroLicencia', label: 'Número de Licencia', type: 'text' },
        { name: 'vencimientoLicencia', label: 'Vencimiento de Licencia', type: 'date' },
        { name: 'fechaAlta', label: 'Fecha de Alta', type: 'date' },
      ]}
      extraActions={(empleado) => (
        <button
          onClick={() => router.push(`/cruds/personal/${empleado.id}`)}
          title="Ver detalle"
          className="text-green-600 hover:text-green-800 text-sm"
        >
          👁
        </button>
      )}
    />
  );
}

