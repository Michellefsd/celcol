export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function api(path: string) {
  return `${API_URL}${path}`;
}

export async function getAvionPorMatricula(matricula: string) {
  const res = await fetch(api(`/avion/${matricula}`));  // 👈 aquí usamos la función api()
  if (!res.ok) {
    throw new Error('Error al obtener el avión');
  }
  return res.json();
}
