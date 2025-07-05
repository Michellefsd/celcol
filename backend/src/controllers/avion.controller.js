const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearAvion = async (req, res) => {
  try {
    const avion = await prisma.avion.create({
      data: req.body
    });
    res.json(avion);
  } catch (error) {
    console.error('Error al crear avión:', error);
    res.status(500).json({ error: 'Error al crear el avión' });
  }
};

// READ ALL
exports.listarAviones = async (req, res) => {
  try {
    const aviones = await prisma.avion.findMany({
      include: {
        propietarios: {
          include: { propietario: true }
        }
      }
    });
    res.json(aviones);
  } catch (error) {
    console.error('Error real en listarAviones:', error);
    res.status(500).json({ error: 'Error al obtener aviones' });
  }
};

// READ ONE
exports.obtenerAvion = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const avion = await prisma.avion.findUnique({
      where: { id },
      include: {
        propietarios: {
          include: { propietario: true }
        },
        motores: true,
        helices: true
      }
    });
    if (!avion) return res.status(404).json({ error: 'Avión no encontrado' });
    res.json(avion);
  } catch (error) {
    console.error('Error al obtener avión:', error);
    res.status(500).json({ error: 'Error al obtener el avión' });
  }
};


// UPDATE (con propietariosIds opcional)
exports.actualizarAvion = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    marca,
    modelo,
    numeroSerie,
    matricula,
    horasDesdeNuevo,
    vencimientoMatricula,
    vencimientoSeguro,
    certificadoMatricula,
    propietariosIds // <- nuevo campo opcional
  } = req.body;

  try {
    const avion = await prisma.avion.update({
      where: { id },
      data: {
        marca,
        modelo,
        numeroSerie,
        matricula,
        horasDesdeNuevo,
        vencimientoMatricula: vencimientoMatricula ? new Date(vencimientoMatricula) : null,
        vencimientoSeguro: vencimientoSeguro ? new Date(vencimientoSeguro) : null,
        certificadoMatricula
      }
    });

    if (Array.isArray(propietariosIds)) {
      const propietarios = await prisma.propietario.findMany({
        where: { id: { in: propietariosIds } }
      });

      if (propietarios.length !== propietariosIds.length) {
        return res.status(400).json({ error: 'Algunos propietarios no existen' });
      }

      await prisma.avionPropietario.deleteMany({ where: { avionId: id } });

      const relaciones = propietariosIds.map(propietarioId => ({
        avionId: id,
        propietarioId
      }));

      await prisma.avionPropietario.createMany({ data: relaciones });
    }

    res.json({ mensaje: 'Avión actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar avión:', error);
    res.status(500).json({ error: 'Error al actualizar el avión' });
  }
};

// DELETE
exports.eliminarAvion = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Borrar relaciones con propietarios antes
    await prisma.avionPropietario.deleteMany({ where: { avionId: id } });

    await prisma.avion.delete({ where: { id } });
    res.json({ mensaje: 'Avión eliminado' });
  } catch (error) {
    console.error('Error al eliminar avión:', error);
    res.status(500).json({ error: 'Error al eliminar el avión' });
  }
};

// ASIGNAR PROPIETARIOS (método separado, opcional)
exports.asignarPropietarios = async (req, res) => {
  const avionId = parseInt(req.params.id);
  const { propietariosIds } = req.body;

  if (!Array.isArray(propietariosIds) || propietariosIds.length === 0) {
    return res.status(400).json({ error: 'Debe asignar al menos un propietario' });
  }

  try {
    const avion = await prisma.avion.findUnique({ where: { id: avionId } });
    if (!avion) return res.status(404).json({ error: 'Avión no encontrado' });

    const propietarios = await prisma.propietario.findMany({
      where: { id: { in: propietariosIds } }
    });

    if (propietarios.length !== propietariosIds.length) {
      return res.status(400).json({ error: 'Algunos propietarios no existen' });
    }

    await prisma.avionPropietario.deleteMany({ where: { avionId } });

    const relaciones = propietariosIds.map(propietarioId => ({
      avionId,
      propietarioId
    }));

    await prisma.avionPropietario.createMany({ data: relaciones });

    res.json({ mensaje: 'Propietarios asignados correctamente' });
  } catch (error) {
    console.error('Error al asignar propietarios:', error);
    res.status(500).json({ error: 'Error al asignar propietarios' });
  }
};
