const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listarMotores = async (req, res) => {
  try {
    const motores = await prisma.motor.findMany({
      include: { avion: true }
    });
    res.json(motores);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar motores' });
  }
};

exports.crearMotor = async (req, res) => {
  try {
    const nuevo = await prisma.motor.create({ data: req.body });
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear motor' });
  }
};

exports.obtenerMotor = async (req, res) => {
  try {
    const motor = await prisma.motor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { avion: true }
    });
    if (!motor) return res.status(404).json({ error: 'Motor no encontrado' });
    res.json(motor);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener motor' });
  }
};

exports.actualizarMotor = async (req, res) => {
  try {
    const motor = await prisma.motor.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(motor);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar motor' });
  }
};

exports.eliminarMotor = async (req, res) => {
  try {
    await prisma.motor.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ mensaje: 'Motor eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar motor' });
  }
};
