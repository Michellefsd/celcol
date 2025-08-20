'use client';
import { api } from '@/services/api';

export default function AuthEntry() {
  const login = () => {
    // El backend arma la URL a KC con el redirect_uri correcto y redirige
    window.location.href = api('/api/auth/login');
  };
  

  return (
    <button
      onClick={login}
      className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2"
    >
      Iniciar sesión
    </button>

  );
}
