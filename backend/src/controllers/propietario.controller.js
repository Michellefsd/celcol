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


// ARCHIVAR PROPIETARIO con bloqueos por OTs abiertas y aviones vinculados
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

    // 1) Bloquear si hay OTs ABIERTAS que referencien aviones o componentes de este propietario
    const otAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        estadoOrden: 'ABIERTA', // ⚠️ cambia a tu campo real si usás 'estado'
        OR: [
          // Orden sobre AVIÓN cuyo set de propietarios incluya a este id
          {
            avion: {
              propietarios: {
                some: { propietarioId: id } // usa { some: { id } } si tu relación es implícita
              }
            }
          },
          // Orden sobre COMPONENTE EXTERNO del propietario
          {
            componente: {
              propietarioId: id
            }
          }
        ]
      },
      select: { id: true }
    });

    if (otAbierta) {
      return res.status(400).json({
        error: `No se puede archivar: existe una OT ABIERTA que involucra a este propietario (OT ID ${otAbierta.id}).`
      });
    }

    // 2) Bloquear si aún tiene AVIONES vinculados (no archivados). Debe desvincularse primero.
    const avionesVinc = await prisma.avionPropietario.findMany({
      where: {
        propietarioId: id,
        avion: { archivado: false },
      },
      select: { avion: { select: { id: true, matricula: true } } }
    });

    if (avionesVinc.length > 0) {
      const listado = avionesVinc
        .map(v => `#${v.avion.id}${v.avion.matricula ? ` (${v.avion.matricula})` : ''}`)
        .join(', ');
      return res.status(400).json({
        error: `No se puede archivar: primero desvinculá estos aviones del propietario: ${listado}.`
      });
    }

    // 3) Archivar EN CASCADA componentes externos del propietario + propietario (transacción)
    const [compResult] = await prisma.$transaction([
      prisma.componenteExterno.updateMany({
        where: { propietarioId: id, archivado: false },
        data: { archivado: true }
      }),
      prisma.propietario.update({
        where: { id },
        data: { archivado: true }
      })
    ]);

    return res.json({
      mensaje: 'Propietario archivado correctamente.',
      componentesArchivados: compResult.count
    });

  } catch (error) {
    console.error('Error al archivar propietario:', error);
    return res.status(500).json({ error: 'Error al archivar el propietario' });
  }
};
