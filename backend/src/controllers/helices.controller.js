const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listarHelices = async (req, res) => {
  try {
    const helices = await prisma.helice.findMany({
      include: { avion: true }
    });
    res.json(helices);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar helices' });
  }
};

exports.crearHelice = async (req, res) => {
  try {
    const nuevo = await prisma.helice.create({ data: req.body });
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear helice' });
  }
};

exports.obtenerHelice = async (req, res) => {
  try {
    const helice = await prisma.helice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { avion: true }
    });
    if (!helice) return res.status(404).json({ error: 'Helice no encontrado' });
    res.json(helice);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener helice' });
  }
};

exports.actualizarHelice = async (req, res) => {
  try {
    const helice = await prisma.helice.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(helice);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar helice' });
  }
};

exports.eliminarHelice = async (req, res) => {
  try {
    await prisma.helice.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ mensaje: 'Helice eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar helice' });
  }
};
