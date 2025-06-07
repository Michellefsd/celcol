export async function getAvionPorMatricula(matricula: string) {
  const res = await fetch(`http://localhost:3001/avion/${matricula}`);
  if (!res.ok) {
    throw new Error('Error al obtener el avión');
  }
  return res.json();
}
