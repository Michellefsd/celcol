import AuthEntry from '@/components/AuthEntry';

export default function LoginPage() {
  return (
    <main className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-6">Iniciar sesión</h1>
      <AuthEntry />
    </main>
  );
}
