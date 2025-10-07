'use client';

import { useState } from 'react';
import { IconDescargar } from '@/components/ui/Icons';
import IconButton from '@/components/IconButton';
import { api } from '@/services/api';

type Props = { ordenId: string | number };

export default function CCMButton({ ordenId }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fecha: '',     
    lugar: '',
    aeronave: '',  
    motor: '',     
  });

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!form.fecha || !form.lugar || !form.aeronave || !form.motor) return;

  setSubmitting(true);
  // Abrimos la pestaña en el click (anti popup blocker)
  const win = window.open('about:blank', '_blank');

  try {
    const resp = await fetch(api(`/ordenes-trabajo/${ordenId}/conformidad-pdf`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha: form.fecha,       // "YYYY-MM-DD"
        lugar: form.lugar,
        aeronave: form.aeronave, // debajo del primer recuadro
        motor: form.motor        // recuadro inferior
      }),
    });

    if (!resp.ok) {
      throw new Error(`Error ${resp.status}`);
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    if (win) {
      // Redirigimos la pestaña abierta al PDF
      win.location.href = url;
      // Liberamos el objeto URL más tarde (cuando el navegador ya cargó)
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    setOpen(false);
  } catch (err) {
    console.error(err);
    if (win) win.close();
    alert('No se pudo generar el PDF');
  } finally {
    setSubmitting(false);
  }
}


  return (
    <>
      <IconButton
        icon={IconDescargar}
        title="CCM"
        className="text-slate-700 hover:text-slate-900"
        label="CCM"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          aria-modal="true"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Datos para el CCM</h2>
              <p className="text-sm text-slate-600">
                Estos campos se insertarán en el PDF: la <b>Fecha</b> arriba a la derecha,
                el <b>Lugar</b> en el primer recuadro, el texto de <b>Aeronave</b> debajo del primer recuadro
                y <b>Motor</b> en el recuadro inferior.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Fecha *</span>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={onChange}
                    className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Lugar *</span>
                  <input
                    type="text"
                    name="lugar"
                    value={form.lugar}
                    onChange={onChange}
                    placeholder="Montevideo, Uruguay"
                    className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Aeronave *</span>
                <input
                  type="text"
                  name="aeronave"
                  value={form.aeronave}
                  onChange={onChange}
                  placeholder="Ej.: Cessna 172, matrícula CX-ABC"
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
                <span className="text-xs text-slate-500">
                  Se imprime debajo del primer recuadro.
                </span>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Motor *</span>
                <textarea
                  name="motor"
                  value={form.motor}
                  onChange={onChange}
                  placeholder="Ej.: Lycoming O-320, S/N 12345"
                  className="min-h-[88px] rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
                <span className="text-xs text-slate-500">
                  Se imprime en el recuadro inferior.
                </span>
              </label>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? 'Generando…' : 'Generar PDF'}
                </button>
              </div>
            </form>

            {/* Cerrar con ESC */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
