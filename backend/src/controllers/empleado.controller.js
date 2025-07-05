const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearEmpleado = async (req, res) => {
  try {
    const empleado = await prisma.Empleado.create({
      data: req.body
    });
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el empleado' });
  }
};

// READ ALL
exports.listarEmpleados = async (req, res) => {
  try {
    const empleados = await prisma.Empleado.findMany();
    res.json(empleados);
  } catch (error) {
    console.error('Error real en listarEmpleados:', error); // 👈 AÑADILO
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};

// READ ONE
exports.obtenerEmpleado = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const empleado = await prisma.Empleado.findUnique({ where: { id } });
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: 'Empleado no encontrado' });
  }
};

// UPDATE
exports.actualizarEmpleado = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const empleado = await prisma.Empleado.update({
      where: { id },
      data: req.body
    });
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el empleado' });
  }
};

// DELETE
exports.eliminarEmpleado = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.Empleado.delete({ where: { id } });
    res.json({ mensaje: 'Empleado eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el empleado' });
  }
};
