import prisma from '../lib/prisma.js';  
// CREATE
export async function crearPropietario(req, res) {
  try {
    const nuevo = await prisma.propietario.create({ data: req.body });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear propietario:', error);
    res.status(500).json({ error: 'Error al crear el propietario' });
  }
};

// READ ALL
export async function listarPropietarios(req, res) {
  try {
    const lista = await prisma.propietario.findMany({ where: { archivado: false } });
    res.json(lista);
  } catch (error) {
    console.error('Error al obtener propietarios:', error);
    res.status(500).json({ error: 'Error al obtener propietarios' });
  }
};

// READ ONE (con relaciones y soporte includeArchived)
export async function obtenerPropietario(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // ?includeArchived=1 | true | yes
    const includeArchived = ['1', 'true', 'yes'].includes(
      String(req.query.includeArchived || '').toLowerCase()
    );

    // Traemos SIEMPRE por id y luego filtramos según archivado
    const base = await prisma.propietario.findUnique({
      where: { id },
      include: {
        // Relación AVIONES (vía tabla intermedia), aplanamos luego
        aviones: {
          ...(includeArchived ? {} : { where: { avion: { archivado: false } } }),
          include: {
            avion: {
              select: {
                id: true,
                marca: true,
                modelo: true,
                matricula: true,
                archivado: true,
              },
            },
          },
        },

        // Relación COMPONENTES EXTERNOS (acá incluimos archivo8130)
        componentes: {
          ...(includeArchived ? {} : { where: { archivado: false } }),
          orderBy: { id: 'desc' }, // opcional
          include: {
            archivo8130: {
              select: {
                id: true,
                storageKey: true,
                originalName: true,
                mime: true,
                sizeAlmacen: true,
              },
            },
          },
        },
      },
    });

    if (!base || (!includeArchived && base.archivado)) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    // Aplanar AvionPropietario → Avion[]
    const aviones = base.aviones.map((rel) => rel.avion);

    return res.json({
      id: base.id,
      tipoPropietario: base.tipoPropietario,
      nombre: base.nombre,
      apellido: base.apellido,
      nombreEmpresa: base.nombreEmpresa,
      rut: base.rut,
      telefono: base.telefono,
      email: base.email,
      direccion: base.direccion,

      // Lo que consume tu FE
      aviones,
      componentesExternos: base.componentes, // ← ahora cada item trae archivo8130 { storageKey, ... }
    });
  } catch (error) {
    console.error('Error al obtener propietario:', error);
    return res.status(500).json({ error: 'Error al obtener el propietario' });
  }
}


// UPDATE
export async function actualizarPropietario(req, res) {
  const id = parseInt(req.params.id, 10);
  try {
    const propietario = await prisma.propietario.findUnique({ where: { id } });

    if (!propietario || propietario.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un propietario archivado o inexistente' });
    }

    const actualizado = await prisma.propietario.update({
      where: { id },
      data: req.body,
    });

    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar propietario:', error);
    res.status(500).json({ error: 'Error al actualizar el propietario' });
  }
};

// // DELETE (si lo mantenés comentado, usá comentario normal /* ... */ para evitar confusiones)
/*
export async function eliminarPropietario(req, res) {
  // ...
};
*/

// ARCHIVAR PROPIETARIO (bloquea por OTs abiertas; archiva componentes en cascada)
export async function archivarPropietario(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const propietario = await prisma.propietario.findUnique({
      where: { id },
      select: { id: true, archivado: true },
    });
    if (!propietario) return res.status(404).json({ error: 'Propietario no encontrado' });
    if (propietario.archivado) return res.status(409).json({ error: 'El propietario ya está archivado.' });

    // 1) BLOQUEO por OT ABIERTA
    const otAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        estadoOrden: 'ABIERTA',
        OR: [
          { avion: { propietarios: { some: { propietarioId: id } } } },
          { componente: { propietarioId: id } },
        ],
      },
      select: { id: true },
    });
    if (otAbierta) {
      return res.status(409).json({
        error: `No se puede archivar: existe una OT ABIERTA que involucra a este propietario (OT ID ${otAbierta.id}).`,
      });
    }

    // 2) BLOQUEO por aviones vinculados (no archivados)
    const avionesVinc = await prisma.avionPropietario.findMany({
      where: { propietarioId: id, avion: { archivado: false } },
      select: { avion: { select: { id: true, matricula: true } } },
    });
    if (avionesVinc.length > 0) {
      const listado = avionesVinc
        .map(v => `#${v.avion.id}${v.avion.matricula ? ` (${v.avion.matricula})` : ''}`)
        .join(', ');
      return res.status(409).json({
        error: `No se puede archivar: primero desvinculá estas aeronaves del propietario: ${listado}.`,
      });
    }

    // 3) TRANSACCIÓN: archiva componentes externos + archiva propietario
    const [compResult] = await prisma.$transaction([
      prisma.componenteExterno.updateMany({
        where: { propietarioId: id, archivado: false },
        data: { archivado: true },
      }),
      prisma.propietario.update({
        where: { id },
        data: { archivado: true },
      }),
    ]);

    return res.json({
      mensaje: 'Propietario archivado correctamente.',
      componentesArchivados: compResult.count,
    });
  } catch (error) {
    console.error('Error al archivar propietario:', {
      message: error?.message, code: error?.code, stack: error?.stack,
    });
    return res.status(500).json({ error: 'Error al archivar el propietario' });
  }
};
