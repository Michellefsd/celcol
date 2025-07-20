'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Fase3OrdenTrabajoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orden, setOrden] = useState<any>(null);
  const [inspeccionRecibida, setInspeccionRecibida] = useState(false);
  const [danosPrevios, setDanosPrevios] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [herramientas, setHerramientas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);

  const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState<number[]>([]);
  const [stockSeleccionado, setStockSeleccionado] = useState<number | null>(null);
  const [cantidadStock, setCantidadStock] = useState<number>(1);

  const [tecnicoId, setTecnicoId] = useState<number | null>(null);
  const [certificadorId, setCertificadorId] = useState<number | null>(null);

  useEffect(() => {
    fetch(api(`/ordenes-trabajo/${id}`))
      .then(res => res.json())
      .then(setOrden);

    fetch(api('/herramientas')).then(res => res.json()).then(setHerramientas);
    fetch(api('/stock')).then(res => res.json()).then(setStock);
    fetch(api('/personal')).then(res => res.json()).then(setPersonal);
  }, [id]);

  const handleGuardar = async () => {
    const res = await fetch(api(`/ordenes-trabajo/${id}/fase3`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspeccionRecibida,
        danosPrevios,
        observaciones,
        herramientas: herramientasSeleccionadas.map((id) => ({ id })),
        stock: stockSeleccionado ? [{ id: stockSeleccionado, cantidad: cantidadStock }] : [],
        empleados: [
          ...(certificadorId ? [{ id: certificadorId }] : []),
          ...(tecnicoId ? [{ id: tecnicoId }] : []),
        ]
      }),
    });

    if (res.ok) {
      alert('Datos guardados correctamente');
      const updated = await res.json();
      setOrden(updated);
    } else {
      alert('Error al guardar');
    }
  };

  if (!orden) return <p className="p-4">Cargando orden...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Fase 3: Recepción y preparación</h1>

      <div className="space-y-3 bg-gray-100 p-4 rounded">
        <p><strong>Tipo:</strong> {orden.avionId ? 'Avión' : 'Componente externo'}</p>
        {orden.avion?.matricula && (
          <p><strong>Avión:</strong> {orden.avion.matricula} - {orden.avion.marca} {orden.avion.modelo}</p>
        )}
        {orden.componente?.tipo && (
          <p><strong>Componente:</strong> {orden.componente.tipo} - {orden.componente.marca} {orden.componente.modelo}</p>
        )}
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={inspeccionRecibida}
            onChange={(e) => setInspeccionRecibida(e.target.checked)}
          />
          Inspección de recibimiento realizada
        </label>

        <div>
          <label className="block font-medium mb-1">Inspección previa (daños, condiciones)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={danosPrevios}
            onChange={(e) => setDanosPrevios(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Observaciones</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Herramientas utilizadas</label>
          <select
            multiple
            className="w-full border rounded px-3 py-2 h-32"
            value={herramientasSeleccionadas.map(String)}
            onChange={(e) =>
              setHerramientasSeleccionadas(
                Array.from(e.target.selectedOptions).map((opt) => Number(opt.value))
              )
            }
          >
            {herramientas.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre} ({h.marca} {h.modelo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Stock utilizado</label>
          <div className="flex gap-2">
            <select
              className="w-full border rounded px-3 py-2"
              value={stockSeleccionado ?? ''}
              onChange={(e) => setStockSeleccionado(Number(e.target.value))}
            >
              <option value="">— Elegir insumo —</option>
              {stock.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.marca} {s.modelo})
                </option>
              ))}
            </select>
            <input
              type="number"
              className="w-24 border rounded px-2 py-1"
              min={1}
              value={cantidadStock}
              onChange={(e) => setCantidadStock(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Técnico certificador</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={certificadorId ?? ''}
            onChange={(e) => setCertificadorId(Number(e.target.value))}
          >
            <option value="">— Seleccionar —</option>
            {personal.filter(p => p.esCertificador).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Técnico</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={tecnicoId ?? ''}
            onChange={(e) => setTecnicoId(Number(e.target.value))}
          >
            <option value="">— Seleccionar —</option>
            {personal.filter(p => p.esTecnico).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => router.push(`/ordenes-trabajo/${id}/fase2`)}
          className="text-blue-600 hover:underline"
        >
          ← Fase anterior
        </button>

        <button
          onClick={() => router.push(`/ordenes-trabajo/${id}/fase4`)}
          className="text-blue-600 hover:underline"
        >
          Fase siguiente →
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
3