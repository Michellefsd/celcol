const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// LISTAR
exports.listarComponentesExternos = async (req, res) => {
  try {
    const componentes = await prisma.componenteExterno.findMany({
      where: { archivado: false },
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

    const archivo = req.file;

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
    const componente = await prisma.componenteExterno.findFirst({
      where: { id, archivado: false },
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
  const componenteActual = await prisma.componenteExterno.findUnique({ where: { id } });
if (componenteActual.archivado) {
  return res.status(400).json({ error: 'No se puede modificar un componente archivado' });
}
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
      const componenteActual = await prisma.componenteExterno.findUnique({ where: { id } });

      if (componenteActual?.archivo8130 && fs.existsSync(componenteActual.archivo8130)) {
        fs.unlinkSync(componenteActual.archivo8130);
      }

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

// SUBIR ARCHIVO 8130 (por separado y reemplazando si ya existe)
exports.subirArchivo8130 = async (req, res) => {
  const componenteId = parseInt(req.params.componenteId);
  const archivo = req.file;

  if (!archivo) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
  }

  try {
    const componente = await prisma.componenteExterno.findUnique({
      where: { id: componenteId }
    });

    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    if (componente.archivo8130 && fs.existsSync(componente.archivo8130)) {
      fs.unlinkSync(componente.archivo8130);
    }

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

// ELIMINAR COMPONENTE
{/*exports.eliminarComponenteExterno = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const componente = await prisma.componenteExterno.findUnique({ where: { id } });

    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    const ordenAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        componenteId: id,
        estadoOrden: 'ABIERTA'
      }
    });

    if (ordenAbierta) {
      return res.status(400).json({
        error: `No se puede eliminar el componente externo. Está en uso en la orden de trabajo ID ${ordenAbierta.id}.`
      });
    }

    await prisma.componenteExterno.update({
      where: { id },
      data: { archivado: true }
    });

    res.json({ mensaje: 'Componente externo archivado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar componente externo:', error);
    res.status(500).json({ error: 'Error al eliminar el componente externo' });
  }
};
*/}

// ARCHIVAR COMPONENTE EXTERNO (validación de OTs abiertas)

exports.archivarComponenteExterno = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const componente = await prisma.componenteExterno.findUnique({ where: { id } });

    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    if (componente.archivado) {
      return res.status(400).json({ error: 'El componente externo ya está archivado.' });
    }

    const ordenAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        componenteId: id,
        estadoOrden: 'ABIERTA'
      }
    });

    if (ordenAbierta) {
      return res.status(400).json({
        error: `No se puede archivar: el componente externo está en uso en la orden de trabajo ID ${ordenAbierta.id}.`
      });
    }

    await prisma.componenteExterno.update({
      where: { id },
      data: { archivado: true }
    });

    res.json({ mensaje: 'Componente externo archivado correctamente.' });
  } catch (error) {
    console.error('Error al archivar componente externo:', error);
    res.status(500).json({ error: 'Error al archivar el componente externo' });
  }
};


