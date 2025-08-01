'use client';

import { useRouter } from 'next/navigation';
import CrudManager from '@/components/CrudManager';
import { api } from '@/services/api'; 

type Propietario = {
  id: number;
  tipoPropietario: 'PERSONA' | 'INSTITUCION';
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
};

export default function PropietariosPage() {
  const router = useRouter();

  const formFields = [
    {
      name: 'tipoPropietario',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'PERSONA', label: 'Persona' },
        { value: 'INSTITUCION', label: 'Institución' },
      ],
    },
    { name: 'nombre', label: 'Nombre', type: 'text' },
    { name: 'apellido', label: 'Apellido', type: 'text' },
    { name: 'nombreEmpresa', label: 'Empresa', type: 'text' },
    { name: 'rut', label: 'RUT', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'direccion', label: 'Dirección', type: 'text' },
  ];

  const validate = (form: Partial<Propietario>): string | null => {
    const tieneEmail = form.email?.trim();
    const tieneTelefono = form.telefono?.trim();
    if (!tieneEmail && !tieneTelefono) {
      return 'Debe ingresar al menos un email o un teléfono.';
    }

    if (form.tipoPropietario === 'PERSONA' && (!form.nombre || !form.apellido)) {
      return 'Debe ingresar nombre y apellido.';
    }

    if (form.tipoPropietario === 'INSTITUCION' && (!form.nombreEmpresa || !form.rut)) {
      return 'Debe ingresar nombre de empresa y RUT.';
    }

    return null;
  };

  return (
    <CrudManager<Propietario>
      title="Propietarios"
      endpoint={api("/propietarios")}
      columns={[
        'tipoPropietario',
        'nombre',
        'apellido',
        'nombreEmpresa',
        'rut',
        'email',
        'telefono',
        'direccion',
      ]}
      formFields={formFields}
      onBeforeSubmit={validate}
      extraActions={(propietario) => (
        <button
          onClick={() => router.push(`/cruds/propietarios/${propietario.id}`)}
          title="Ver detalle"
          className="text-green-600 hover:text-green-800 text-sm"
        >
          👁
        </button>
      )}
    />
  );
}
