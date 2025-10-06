import prisma from '../lib/prisma.js';

// GET /avisos – Listar todos los avisos
export const listarAvisos = async (_req, res) => {
  try {
    console.log('🔍 Listando avisos...');
    const avisos = await prisma.aviso.findMany({
      orderBy: { creadoEn: 'desc' },
    });
    res.json(avisos);
  } catch (error) {
    console.error('❌ Error al obtener avisos:', error);
    res.status(500).json({ error: 'Error al obtener los avisos' });
  }
};

// PUT /avisos/:id/leido – Marcar como leído
export const marcarComoLeido = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const aviso = await prisma.aviso.update({
      where: { id },
      data: { leido: true },
    });
    res.json(aviso);
  } catch (error) {
    console.error('❌ Error al marcar aviso como leído:', error);
    res.status(500).json({ error: 'No se pudo actualizar el aviso' });
  }
};

// DELETE /avisos/:id – Eliminar aviso
export const eliminarAviso = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.aviso.delete({ where: { id } });
    res.json({ mensaje: 'Aviso eliminado' });
  } catch (error) {
    console.error('❌ Error al eliminar aviso:', error);
    res.status(500).json({ error: 'No se pudo eliminar el aviso' });
  }
};
