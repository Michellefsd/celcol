'use client';

import CrudManager from '@/components/CrudManager';

type Propietario = {
  id: number;
  tipoPropietario: string;
  nombre?: string;
  apellido?: string;
  nombreEmpresa?: string;
  rut?: string;
  email: string;
  telefono: string;
  direccion?: string;
};

export default function PropietariosPage() {
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
          label: 'Tipo de Propietario',
          type: 'select',
          options: [
            { value: 'PERSONA', label: 'Persona' },
            { value: 'INSTITUCION', label: 'Institución' },
          ],
        },
        { name: 'nombre', label: 'Nombre', type: 'text' },
        { name: 'apellido', label: 'Apellido', type: 'text' },
        { name: 'nombreEmpresa', label: 'Nombre de la Empresa', type: 'text' },
        { name: 'rut', label: 'RUT', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'telefono', label: 'Teléfono', type: 'text' },
        { name: 'direccion', label: 'Dirección', type: 'text' },
      ]}
    />
  );
}
