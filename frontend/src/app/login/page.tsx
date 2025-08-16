'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BaseCard from '@/components/BaseCard';
import BaseHeading from '@/components/BaseHeading';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/'); // a tu home
    } catch (e: any) {
      setErr(e.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <BaseCard>
        <div className="w-[360px] max-w-full">
          <BaseHeading>Ingresá a Celcol</BaseHeading>
          <p className="text-gray-500 mt-1 mb-6">Accedé con tu correo y contraseña.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {err && <div className="text-red-600 text-sm">{err}</div>}
<Link href="/reset" className="text-sm text-cyan-700 hover:underline">
  Olvidé mi contraseña
</Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl shadow px-4 py-2 bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60"
            >
              {loading ? 'Ingresando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </BaseCard>
    </div>
  );
}
