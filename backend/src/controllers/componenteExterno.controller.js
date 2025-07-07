const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// LISTAR
exports.listarComponentesExternos = async (req, res) => {
  try {
    const componentes = await prisma.componenteExterno.findMany({
      include: { propietario: true },
    });
    res.json(componentes);
  } catch (error) {
    console.error('Error al listar componentes externos:', error);
    res.status(500).json({ error: 'Error al obtener los componentes externos' });
  }
};

// CREAR
exports.crearComponenteExterno = async (req, res) => {
  try {
    const {
      tipo,
      marca,
      modelo,
      numeroSerie,
      numeroParte,
      TSN,
      TSO,
      TBOFecha,
      TBOHoras,
      propietarioId,
    } = req.body;

    const archivo = req.file; // ← este llega por uploadComponenteExterno

    if (!marca || !modelo || !numeroSerie || !propietarioId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const componente = await prisma.componenteExterno.create({
      data: {
        tipo: tipo || null,
        marca,
        modelo,
        numeroSerie,
        numeroParte: numeroParte || null,
        TSN: TSN ? parseFloat(TSN) : null,
        TSO: TSO ? parseFloat(TSO) : null,
        TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
        TBOHoras: TBOHoras ? parseInt(TBOHoras) : null,
        archivo8130: archivo ? archivo.path : null,
        propietarioId: parseInt(propietarioId),
      },
    });

    res.status(201).json(componente);
  } catch (error) {
    console.error('Error al crear componente externo:', error);
    res.status(500).json({ error: 'Error al crear el componente externo' });
  }
};

// OBTENER POR ID
exports.obtenerComponenteExterno = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      include: { propietario: true },
    });

    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    res.json(componente);
  } catch (error) {
    console.error('Error al obtener componente externo:', error);
    res.status(500).json({ error: 'Error al obtener el componente externo' });
  }
};

// ACTUALIZAR
exports.actualizarComponenteExterno = async (req, res) => {
  const id = parseInt(req.params.id);
  const archivo = req.file;

  try {
    const {
      tipo,
      marca,
      modelo,
      numeroSerie,
      numeroParte,
      TSN,
      TSO,
      TBOFecha,
      TBOHoras,
      propietarioId,
    } = req.body;

    const data = {
      tipo,
      marca,
      modelo,
      numeroSerie,
      numeroParte: numeroParte || null,
      TSN: TSN ? parseFloat(TSN) : null,
      TSO: TSO ? parseFloat(TSO) : null,
      TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
      TBOHoras: TBOHoras ? parseInt(TBOHoras) : null,
      propietarioId: propietarioId ? parseInt(propietarioId) : undefined,
    };

    if (archivo) {
      data.archivo8130 = archivo.path;
    }

    const actualizado = await prisma.componenteExterno.update({
      where: { id },
      data,
    });

    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar componente externo:', error);
    res.status(500).json({ error: 'Error al actualizar el componente externo' });
  }
};

// SUBIR ARCHIVO 8130 (por separado)
exports.subirArchivo8130 = async (req, res) => {
  const componenteId = parseInt(req.params.componenteId);
  const archivo = req.file;

  if (!archivo) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
  }

  try {
    const actualizado = await prisma.componenteExterno.update({
      where: { id: componenteId },
      data: { archivo8130: archivo.path },
    });

    res.json({ mensaje: 'Archivo subido correctamente', componente: actualizado });
  } catch (error) {
    console.error('Error al subir archivo 8130:', error);
    res.status(500).json({ error: 'Error al subir el archivo 8130' });
  }
};

const fs = require('fs');
const path = require('path');

// Eliminar componente externo y su archivo asociado  

exports.eliminarComponenteExterno = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const componente = await prisma.componenteExterno.findUnique({ where: { id } });

    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    // Eliminar archivo físico si existe
    if (componente.archivo8130) {
      const rutaCompleta = path.join(__dirname, '../../', componente.archivo8130);
      fs.unlink(rutaCompleta, (err) => {
        if (err) console.warn('No se pudo eliminar archivo:', err.message);
      });
    }

    // Eliminar componente de la base de datos
    await prisma.componenteExterno.delete({ where: { id } });

    res.json({ mensaje: 'Componente externo y archivo eliminado' });
  } catch (error) {
    console.error('Error al eliminar componente externo:', error);
    res.status(500).json({ error: 'Error al eliminar el componente externo' });
  }
};
