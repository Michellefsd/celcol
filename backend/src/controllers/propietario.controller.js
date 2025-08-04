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
    const lista = await prisma.propietario.findMany({
      where: { archivado: false }
    });
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
    const propietario = await prisma.propietario.findFirst({
      where: { id, archivado: false },
      include: {
        aviones: { include: { avion: true } },
        componentes: true
      }
    });

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

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
    const propietario = await prisma.propietario.findUnique({ where: { id } });

    if (!propietario || propietario.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un propietario archivado o inexistente' });
    }

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
{/*exports.eliminarPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const aviones = await prisma.avion.findMany({ where: { propietarioId: id } });
    const componentes = await prisma.componenteExterno.findMany({ where: { propietarioId: id } });

    const ordenAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        estadoOrden: 'ABIERTA',
        OR: [
          { avionId: { in: aviones.map(a => a.id) } },
          { componenteId: { in: componentes.map(c => c.id) } }
        ]
      }
    });

    if (ordenAbierta) {
      return res.status(400).json({
        error: `No se puede eliminar el propietario. Tiene recursos en uso en la orden de trabajo ID ${ordenAbierta.id}.`
      });
    }

    await prisma.propietario.update({
      where: { id },
      data: { archivado: true }
    });

    res.json({ mensaje: 'Propietario archivado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar propietario:', error);
    res.status(500).json({ error: 'Error al eliminar el propietario' });
  }
};
*/}

// ARCHIVAR (con validación de uso en OTs abiertas)
exports.archivarPropietario = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const propietario = await prisma.propietario.findUnique({ where: { id } });

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    if (propietario.archivado) {
      return res.status(400).json({ error: 'El propietario ya está archivado.' });
    }

    // Obtener aviones y componentes externos asociados
    const [aviones, componentes] = await Promise.all([
      prisma.avion.findMany({ where: { propietarioId: id } }),
      prisma.componenteExterno.findMany({ where: { propietarioId: id } }),
    ]);

    const avionIds = aviones.map((a) => a.id);
    const componenteIds = componentes.map((c) => c.id);

    if (avionIds.length === 0 && componenteIds.length === 0) {
      // Si no tiene recursos, permitir archivado directamente
      await prisma.propietario.update({
        where: { id },
        data: { archivado: true },
      });
      return res.json({ mensaje: 'Propietario archivado correctamente (sin recursos asociados).' });
    }

    // Verificar si alguno está en uso en una OT abierta
    const ordenAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        estadoOrden: 'ABIERTA',
        OR: [
          { avionId: { in: avionIds } },
          { componenteId: { in: componenteIds } },
        ],
      },
    });

    if (ordenAbierta) {
      return res.status(400).json({
        error: `No se puede archivar: el propietario tiene recursos en uso en la orden de trabajo ID ${ordenAbierta.id}.`,
      });
    }

    // Si no hay OTs abiertas, permitir archivado
    await prisma.propietario.update({
      where: { id },
      data: { archivado: true },
    });

    res.json({ mensaje: 'Propietario archivado correctamente.' });
  } catch (error) {
    console.error('Error al archivar propietario:', error);
    res.status(500).json({ error: 'Error al archivar el propietario' });
  }
};
