'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ResetRequestPage() {
  const goToKeycloakReset = () => {
    const base = process.env.NEXT_PUBLIC_KC_BASE!;
    const clientId = process.env.NEXT_PUBLIC_KC_CLIENT_ID!;
    const redirect = process.env.NEXT_PUBLIC_APP_REDIRECT!;
    const url =
      `${base}/realms/Celcol/login-actions/reset-credentials` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirect)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md space-y-5 bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <Image src="/celcol.png" alt="Celcol" width={64} height={64} />
          <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
        </div>

        <p className="text-gray-600">
          Te vamos a redirigir a la página segura de Keycloak para solicitar el enlace de recuperación.
        </p>
        <button
          onClick={goToKeycloakReset}
          className="w-full rounded-2xl px-4 py-2 bg-cyan-500 text-white hover:bg-cyan-600"
        >
          Ir a “Olvidé mi contraseña”
        </button>

        <div className="text-center">
          <Link href="/login" className="text-sm text-cyan-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
