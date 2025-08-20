'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, fetchJson } from '@/services/api';

export default function ResetDoPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);

    if (password.length < 8) return setErr('Mínimo 8 caracteres');
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return setErr('Debe tener letras y números');
    if (password !== confirm) return setErr('Las contraseñas no coinciden');

    setLoading(true);
    try {
await fetchJson('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }), // tu helper no stringify objetos
      });
      setMsg('Contraseña actualizada. Redirigiendo…');
      setTimeout(()=> router.replace('/login'), 1000);
    } catch (e:any) {
      setErr(e?.body?.error || e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-4">
      <h1 className="text-xl font-semibold">Nueva contraseña</h1>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm text-gray-700">Contraseña nueva</label>
        <input
          type="password"
          className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-400 outline-none"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        <label className="block text-sm text-gray-700">Repetir contraseña</label>
        <input
          type="password"
          className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-400 outline-none"
          value={confirm}
          onChange={e=>setConfirm(e.target.value)}
        />

        {err && <div className="text-red-600 text-sm">{err}</div>}
        {msg && <div className="text-green-600 text-sm">{msg}</div>}

        <button
          disabled={loading}
          className="rounded-2xl px-4 py-2 bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </form>

      <Link href="/login" className="text-sm text-cyan-700 hover:underline">
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
