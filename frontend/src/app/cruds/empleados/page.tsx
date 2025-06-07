import CrudManager from '@/components/CrudManager';

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
  fechaBaja: string;
  horasTrabajadas: number;

};

export default function EmpleadosPage() {
  return (
    <CrudManager<Empleado>
      title="Empleados"
      endpoint="http://localhost:3001/empleados"
      columns={[
        'nombre', 'apellido', 'telefono', 'email', 'esCertificador', 
        'esTecnico', 'direccion', 'tipoLicencia', 'numeroLicencia', 
        'vencimientoLicencia', 'fechaAlta', 'fechaBaja', 'horasTrabajadas'
      ]}
      formFields={[
        { name: 'nombre', label: 'Nombre', type: 'text' },
        { name: 'apellido', label: 'Apellido', type: 'text' },
        { name: 'telefono', label: 'Teléfono', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'esCertificador', label: '¿Es certificador?', type: 'checkbox' },
        { name: 'esTecnico', label: '¿Es técnico?', type: 'checkbox' },
        { name: 'direccion', label: 'Dirección', type: 'text' },
        { name: 'tipoLicencia', label: 'Tipo de Licencia', type: 'text' },
        { name: 'numeroLicencia', label: 'Número de Licencia', type: 'text' },
        { name: 'vencimientoLicencia', label: 'Vencimiento de Licencia', type: 'date' },
        { name: 'fechaAlta', label: 'Fecha de Alta', type: 'date' },
        { name: 'fechaBaja', label: 'Fecha de Baja', type: 'date' },
        { name: 'horasTrabajadas', label: 'Horas Trabajadas', type: 'number' }

      ]}
    />
  );
}
