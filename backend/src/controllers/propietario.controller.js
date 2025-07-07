const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearPropietario = async (req, res) => {
  try {
    const nuevo = await prisma.propietario.create({
      data: req.body
    });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear propietario:', error);
    res.status(500).json({ error: 'Error al crear el propietario' });
  }
};

// READ ALL
exports.listarPropietarios = async (req, res) => {
  try {
    const lista = await prisma.propietario.findMany();
    res.json(lista);
  } catch (error) {
    console.error('Error al obtener propietarios:', error);
    res.status(500).json({ error: 'Error al obtener propietarios' });
  }
};

// READ ONE (con relaciones)
exports.obtenerPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const propietario = await prisma.propietario.findUnique({
      where: { id },
      include: {
        aviones: {
          include: { avion: true }
        },
        componentes: true
      }
    });

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    // Extraer los aviones de la tabla intermedia
    const aviones = propietario.aviones.map(rel => rel.avion);

    res.json({
      ...propietario,
      aviones,
      componentesExternos: propietario.componentes
    });
  } catch (error) {
    console.error('Error al obtener propietario:', error);
    res.status(500).json({ error: 'Error al obtener el propietario' });
  }
};

// UPDATE
exports.actualizarPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const actualizado = await prisma.propietario.update({
      where: { id },
      data: req.body
    });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar propietario:', error);
    res.status(500).json({ error: 'Error al actualizar el propietario' });
  }
};

// DELETE
exports.eliminarPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.propietario.delete({ where: { id } });
    res.json({ mensaje: 'Propietario eliminado' });
  } catch (error) {
    console.error('Error al eliminar propietario:', error);
    res.status(500).json({ error: 'Error al eliminar el propietario' });
  }
};
