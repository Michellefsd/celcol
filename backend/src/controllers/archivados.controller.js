import prisma from '../lib/prisma.js';

export async function listarArchivados(_req, res) {
  try {
    const [
      ordenes,
      empleados,
      herramientas,
      stock,
      propietarios,
      componentes,
      aviones,
    ] = await Promise.all([
      prisma.ordenTrabajo.findMany({ where: { archivada: true } }),
      prisma.empleado.findMany({ where: { archivado: true } }),
      prisma.herramienta.findMany({ where: { archivado: true } }),
      prisma.stock.findMany({ where: { archivado: true } }),
      prisma.propietario.findMany({ where: { archivado: true } }),
      prisma.componenteExterno.findMany({ where: { archivado: true } }),
      prisma.avion.findMany({ where: { archivado: true } }),
    ]);

    res.json({
      ordenes,
      empleados,
      herramientas,
      stock,
      propietarios,
      componentes,
      aviones,
    });
  } catch (error) {
    console.error('Error al listar archivados:', error);
    res.status(500).json({ error: 'Error al obtener datos archivados' });
  }
}
