const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearPropietario = async (req, res) => {
  try {
    const propietario = await prisma.Propietario.create({
      data: req.body
    });
    res.json(propietario);
  } catch (error) {
    console.error('Error al crear propietario:', error);
    res.status(500).json({ error: 'Error al crear el propietario' });
  }
};

// READ ALL
exports.listarPropietarios = async (req, res) => {
  try {
    const propietarios = await prisma.Propietario.findMany();
    res.json(propietarios);
  } catch (error) {
    console.error('Error al obtener propietarios:', error);
    res.status(500).json({ error: 'Error al obtener propietarios' });
  }
};

// READ ONE con relaciones completas
exports.obtenerPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const propietario = await prisma.propietario.findUnique({
      where: { id },
      include: {
        aviones: {
          include: {
            avion: true
          }
        },
        componentes: true
      }
    });

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    // Aplanamos los aviones desde la relación intermedia
    const aviones = propietario.aviones.map((rel) => rel.avion);

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
    const propietario = await prisma.Propietario.update({
      where: { id },
      data: req.body
    });
    res.json(propietario);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el propietario' });
  }
};

// DELETE
exports.eliminarPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.Propietario.delete({ where: { id } });
    res.json({ mensaje: 'Propietario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el propietario' });
  }
};
