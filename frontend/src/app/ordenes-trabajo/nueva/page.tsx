'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseButton from '@/components/BaseButton';
import { api } from '@/services/api';
import ComboboxBuscador from '@/components/ComboBoxBuscador';

export default function NuevaOrdenPage() {
  const router = useRouter();

  const [modo, setModo] = useState<'AVION' | 'COMPONENTE' | null>(null);

  // Avión
  const [aviones, setAviones] = useState<any[]>([]);
  const [avionId, setAvionId] = useState<number | null>(null);

  // Componente
  const [propietarios, setPropietarios] = useState<any[]>([]);
  const [propietarioId, setPropietarioId] = useState<number | null>(null);
  const [componentes, setComponentes] = useState<any[]>([]);
  const [componenteId, setComponenteId] = useState<number | null>(null);

  // Cargar aviones o propietarios al elegir modo
  useEffect(() => {
    if (modo === 'AVION') {
      fetch(api('/aviones'))
        .then((res) => res.json())
        .then(setAviones);
    } else if (modo === 'COMPONENTE') {
      fetch(api('/propietarios'))
        .then((res) => res.json())
        .then(setPropietarios);
    }
  }, [modo]);

  // Cargar componentes externos al elegir propietario
  useEffect(() => {
    if (modo === 'COMPONENTE' && propietarioId) {
      fetch(api(`/componentes?propietarioId=${propietarioId}`))
        .then((res) => res.json())
        .then(setComponentes);
    }
  }, [modo, propietarioId]);

  // Crear orden
  async function crearOrden() {
    const body =
      modo === 'AVION' && avionId
        ? { avionId }
        : modo === 'COMPONENTE' && componenteId
        ? { componenteId }
        : null;

    if (!body) return alert('Seleccioná un elemento válido');

    const res = await fetch(api('/ordenes-trabajo'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/ordenes-trabajo/${data.id}/fase2`);
    } else {
      alert('Error al crear la orden');
    }
  }
  

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-bold">Crear nueva orden de trabajo</h1>

      <div className="flex gap-4">
        <BaseButton onClick={() => setModo('AVION')}>Avión</BaseButton>
        <BaseButton onClick={() => setModo('COMPONENTE')}>Componente</BaseButton>
      </div>

      {modo === 'AVION' && (
        <ComboboxBuscador
          opciones={aviones.map((a) => ({
            id: a.id,
            nombre: `${a.matricula} - ${a.marca} ${a.modelo}`,
          }))}
          valor={avionId}
          setValor={setAvionId}
          label="Seleccionar avión"
        />
      )}

      {modo === 'COMPONENTE' && (
        <>
          <ComboboxBuscador
            opciones={propietarios.map((p) => ({
              id: p.id,
              nombre:
                p.tipoPropietario === 'PERSONA'
                  ? `${p.nombre?.trim() ?? ''} ${p.apellido?.trim() ?? ''}`.trim()
                  : p.nombreEmpresa?.trim() ?? '—',
            }))}
            valor={propietarioId}
            setValor={(id) => {
              setPropietarioId(id);
              setComponentes([]);
              setComponenteId(null);
            }}
            label="Seleccionar propietario"
          />

          {propietarioId && (
            <ComboboxBuscador
              opciones={componentes.map((c) => ({
                id: c.id,
                nombre: `${c.tipo ?? '—'} - ${c.marca ?? '—'} ${c.modelo ?? ''}`,
              }))}
              valor={componenteId}
              setValor={setComponenteId}
              label="Seleccionar componente"
            />
          )}
        </>
      )}

      {(modo === 'AVION' && avionId) ||
      (modo === 'COMPONENTE' && componenteId) ? (
        <BaseButton onClick={crearOrden}>Crear orden y continuar</BaseButton>
      ) : null}
    </div>
  );
}
