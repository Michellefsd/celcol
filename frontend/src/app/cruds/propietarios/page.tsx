'use client';

import { useRouter } from 'next/navigation';
import CrudManager from '@/components/CrudManager';

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

  // Validación personalizada: requiere email o teléfono
  const validate = (form: Partial<Propietario>): string | null => {
    const tieneEmail = form.email?.trim();
    const tieneTelefono = form.telefono?.trim();
    if (!tieneEmail && !tieneTelefono) {
      return 'Debe ingresar al menos un email o un teléfono.';
    }
    return null;
  };

  return (
    <CrudManager<Propietario>
      title="Propietarios"
      endpoint="http://localhost:3001/propietarios"
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
      formFields={[
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
      ]}
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
