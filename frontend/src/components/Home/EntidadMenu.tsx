'use client';

const entidades = ['Clientes', 'Aviones', 'Stock', 'Herramientas', 'Empleados'];

export default function EntidadMenu() {
  return (
    <div className="space-y-4">
      {entidades.map((entidad) => (
        <button
          key={entidad}
          className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow hover:bg-gray-50 transition"
          onClick={() => alert(`Ir a CRUD de ${entidad}`)}
        >
          {entidad}
        </button>
      ))}
    </div>
  );
}
