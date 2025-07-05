const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearComponente = async (req, res) => {
  try {
    const { marca, modelo, numeroSerie, propietarioId } = req.body;
    const archivo = req.file; // manualPdf enviado por FormData

    if (!marca || !modelo || !numeroSerie || !propietarioId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const componente = await prisma.componenteExterno.create({
      data: {
        marca,
        modelo,
        numeroSerie,
        propietarioId: parseInt(propietarioId),
        archivo8130: archivo ? archivo.path : null, // campo opcional en Prisma
      },
    });

    res.status(201).json(componente);
  } catch (error) {
    console.error('Error al crear componente:', error);
    res.status(500).json({ error: 'Error al crear el componente externo' });
  }
};

// READ ALL
exports.listarComponentes = async (req, res) => {
  try {
    const componentes = await prisma.componenteExterno.findMany({
      include: { propietario: true },
    });
    res.json(componentes);
  } catch (error) {
    console.error('Error al listar componentes:', error);
    res.status(500).json({ error: 'Error al obtener los componentes' });
  }
};

// READ ONE
exports.obtenerComponente = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      include: {
        propietario: true,
        ordenesTrabajo: true,
      },
    });
    if (!componente) return res.status(404).json({ error: 'Componente no encontrado' });
    res.json(componente);
  } catch (error) {
    console.error('Error al obtener componente:', error);
    res.status(500).json({ error: 'Error al obtener el componente' });
  }
};

// UPDATE
exports.actualizarComponente = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { marca, modelo, numeroSerie, propietarioId } = req.body;
    const archivo = req.file;

    const data = {
      marca,
      modelo,
      numeroSerie,
      ...(archivo && { archivo8130: archivo.path }),
    };

    if (propietarioId && !isNaN(parseInt(propietarioId))) {
      data.propietario = {
        connect: { id: parseInt(propietarioId) },
      };
    }

    const componente = await prisma.componenteExterno.update({
      where: { id },
      data,
    });

    res.json(componente);
  } catch (error) {
    console.error('Error al actualizar componente:', error);
    res.status(500).json({ error: 'Error al actualizar el componente' });
  }
};


// DELETE
exports.eliminarComponente = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.componenteExterno.delete({ where: { id } });
    res.json({ mensaje: 'Componente eliminado' });
  } catch (error) {
    console.error('Error al eliminar componente:', error);
    res.status(500).json({ error: 'Error al eliminar el componente' });
  }
};

// SUBIR ARCHIVO 8130 (si querés seguir usando este endpoint por separado)
exports.subirArchivo8130 = async (req, res) => {
  const { componenteId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo.' });
  }

  try {
    const archivoPath = req.file.path;

    const componente = await prisma.componenteExterno.update({
      where: { id: parseInt(componenteId) },
      data: { archivo8130: archivoPath },
    });

    res.json({ mensaje: 'Archivo subido correctamente', componente });
  } catch (error) {
    console.error('Error al subir archivo 8130:', error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
};
