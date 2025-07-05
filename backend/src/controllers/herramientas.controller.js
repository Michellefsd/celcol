const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearHerramienta = async (req, res) => {
  try {
    const {
      nombre, tipo, marca, modelo,
      numeroSerie, fechaIngreso, fechaVencimiento,
      certificadoCalibracion, TBOFecha, TBOHoras
    } = req.body;
    const archivo = req.file;

    if (!nombre || !tipo || !marca || !modelo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const herramienta = await prisma.herramienta.create({
      data: {
        nombre,
        tipo,
        marca,
        modelo,
        numeroSerie,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        certificadoCalibracion,
        archivo8130: archivo ? archivo.path : null,
        TBOFecha: TBOFecha ? new Date(TBOFecha) : undefined,
        TBOHoras: TBOHoras ? parseFloat(TBOHoras) : undefined,
      },
    });

    res.status(201).json(herramienta);
  } catch (error) {
    console.error('Error al crear herramienta:', error);
    res.status(500).json({ error: 'Error al crear la herramienta' });
  }
};

// READ ALL
exports.listarHerramientas = async (req, res) => {
  try {
    const herramientas = await prisma.herramienta.findMany();
    res.json(herramientas);
  } catch (error) {
    console.error('Error al listar herramientas:', error);
    res.status(500).json({ error: 'Error al obtener las herramientas' });
  }
};

// READ ONE
exports.obtenerHerramienta = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const herramienta = await prisma.herramienta.findUnique({ where: { id } });
    if (!herramienta) return res.status(404).json({ error: 'Herramienta no encontrada' });
    res.json(herramienta);
  } catch (error) {
    console.error('Error al obtener herramienta:', error);
    res.status(500).json({ error: 'Error al obtener la herramienta' });
  }
};

// UPDATE
exports.actualizarHerramienta = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const {
      nombre, tipo, marca, modelo,
      numeroSerie, fechaIngreso, fechaVencimiento,
      certificadoCalibracion, TBOFecha, TBOHoras
    } = req.body;
    const archivo = req.file;

    const herramienta = await prisma.herramienta.update({
      where: { id },
      data: {
        nombre,
        tipo,
        marca,
        modelo,
        numeroSerie,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        certificadoCalibracion,
        ...(archivo && { archivo8130: archivo.path }),
        TBOFecha: TBOFecha ? new Date(TBOFecha) : undefined,
        TBOHoras: TBOHoras ? parseFloat(TBOHoras) : undefined,
      },
    });

    res.json(herramienta);
  } catch (error) {
    console.error('Error al actualizar herramienta:', error);
    res.status(500).json({ error: 'Error al actualizar la herramienta' });
  }
};

// DELETE
exports.eliminarHerramienta = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.herramienta.delete({ where: { id } });
    res.json({ mensaje: 'Herramienta eliminada' });
  } catch (error) {
    console.error('Error al eliminar herramienta:', error);
    res.status(500).json({ error: 'Error al eliminar la herramienta' });
  }
};

// SUBIR ARCHIVO (si lo mantenés separado)
exports.subirArchivo8130 = async (req, res) => {
  const { herramientaId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo.' });
  }

  try {
    const archivoPath = req.file.path;

    const herramienta = await prisma.herramienta.update({
      where: { id: parseInt(herramientaId) },
      data: { archivo8130: archivoPath },
    });

    res.json({ mensaje: 'Archivo subido correctamente', herramienta });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
};
