const fs = require('fs');
const path = require('path');

/**
 * Reemplaza un archivo anterior y guarda uno nuevo en el campo indicado.
 */
async function subirArchivoGenerico({
  req,
  res,
  modeloPrisma,
  campoArchivo,
  campoParam = 'id',
  nombreRecurso = 'Recurso'
}) {
  const id = parseInt(req.params[campoParam]);
  const archivo = req.files?.[campoArchivo]?.[0];

  if (!archivo) {
    return res.status(400).json({ error: `No se proporcionó el archivo: ${campoArchivo}` });
  }

  try {
    const recurso = await modeloPrisma.findUnique({ where: { id } });
    if (!recurso) {
      return res.status(404).json({ error: `${nombreRecurso} no encontrado` });
    }

    const rutaAnterior = recurso[campoArchivo];
    if (rutaAnterior) {
      const rutaAbsoluta = path.join(__dirname, '..', rutaAnterior);
      if (fs.existsSync(rutaAbsoluta)) {
        fs.unlinkSync(rutaAbsoluta);
      }
    }

    const nuevaRuta = `uploads/${archivo.filename}`;

    const actualizado = await modeloPrisma.update({
      where: { id },
      data: { [campoArchivo]: nuevaRuta },
    });

    res.status(200).json({
      mensaje: `${campoArchivo} actualizado correctamente`,
      [nombreRecurso.toLowerCase()]: actualizado,
    });
  } catch (error) {
    console.error(`Error al subir archivo de ${nombreRecurso}:`, error);
    res.status(500).json({ error: 'Error interno al subir el archivo' });
  }
}

module.exports = { subirArchivoGenerico };
