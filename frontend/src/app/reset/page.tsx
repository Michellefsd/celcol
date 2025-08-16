'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';

export default function ResetRequestPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(api('/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-4">
      <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
      {sent ? (
        <p className="text-gray-600">
          Si el email existe, te enviamos un enlace para restablecerla. Revisá tu bandeja (y spam).
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border rounded-xl px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button disabled={loading} className="rounded-2xl px-4 py-2 bg-cyan-500 text-white">
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
      <Link href="/login" className="text-sm text-cyan-700 hover:underline">Volver a iniciar sesión</Link>
    </div>
  );
}
