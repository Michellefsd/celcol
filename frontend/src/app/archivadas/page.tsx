'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import BaseCard from '@/components/BaseCard';
import BaseHeading from '@/components/BaseHeading';
import TrabajoCard from '@/components/Home/TrabajoCard';

export default function ArchivadosPage() {
  const [data, setData] = useState<any>(null);
  const [tipo, setTipo] = useState<string>('ordenes');

  useEffect(() => {
    fetch(api('/archivados'))
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error('Error al cargar archivados:', err));
  }, []);

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipo(e.target.value);
  };

  const renderContenido = () => {
    if (!data) return <p>Cargando...</p>;

    switch (tipo) {
      case 'ordenes':
        return <TrabajoCard soloArchivadas />;
      case 'empleados':
        return (
          <ul className="mt-4 text-sm">
            {data.empleados.map((e: any) => (
              <li key={e.id}>{e.nombre} {e.apellido}</li>
            ))}
          </ul>
        );
      case 'herramientas':
        return (
          <ul className="mt-4 text-sm">
            {data.herramientas.map((h: any) => (
              <li key={h.id}>{h.nombre} – {h.marca} {h.modelo}</li>
            ))}
          </ul>
        );
      case 'stock':
        return (
          <ul className="mt-4 text-sm">
            {data.stock.map((s: any) => (
              <li key={s.id}>{s.nombre} ({s.tipoProducto})</li>
            ))}
          </ul>
        );
      case 'propietarios':
        return (
          <ul className="mt-4 text-sm">
            {data.propietarios.map((p: any) => (
              <li key={p.id}>{p.nombre}</li>
            ))}
          </ul>
        );
      case 'componentes':
        return (
          <ul className="mt-4 text-sm">
            {data.componentes.map((c: any) => (
              <li key={c.id}>{c.tipo} – {c.marca} {c.modelo}</li>
            ))}
          </ul>
        );
      case 'aviones':
        return (
          <ul className="mt-4 text-sm">
            {data.aviones.map((a: any) => (
              <li key={a.id}>{a.matricula} – {a.marca} {a.modelo}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <BaseCard>
      <BaseHeading>Archivados</BaseHeading>
      <select
        value={tipo}
        onChange={handleTipoChange}
        className="border px-2 py-1 rounded mb-4"
      >
        <option value="ordenes">Órdenes de Trabajo</option>
        <option value="empleados">Empleados</option>
        <option value="herramientas">Herramientas</option>
        <option value="stock">Stock</option>
        <option value="propietarios">Propietarios</option>
        <option value="componentes">Componentes Externos</option>
        <option value="aviones">Aviones</option>
      </select>

      {renderContenido()}
    </BaseCard>
  );
}
