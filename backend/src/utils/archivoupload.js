// src/utils/archivoupload.js (ESM)
import { PrismaClient } from '@prisma/client';
import { archivoStorage } from '../services/archivo.service.js';

const prisma = new PrismaClient();

/**
 * Sube un archivo y lo asocia como FK <campoArchivo>Id al registro indicado.
 * Requiere multer.memoryStorage() y que el campo del form se llame como `campoArchivo`.
 *
 * Ej: subirArchivoGenerico({ modeloPrisma: prisma.avion, campoArchivo: 'certificadoMatricula', campoParam: 'id' })
 */
export async function subirArchivoGenerico({
  req,
  res,
  modeloPrisma,
  campoArchivo,            // p.ej. 'certificadoMatricula' (la RELACIÓN en Prisma)
  campoParam = 'id',       // p.ej. ':id' en la ruta
  nombreRecurso = 'Recurso',
  borrarAnterior = false,  // si true, remueve archivo/row anterior
}) {
  try {
    const id = Number(req.params?.[campoParam]);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const file = req.files?.[campoArchivo]?.[0];
    if (!file) {
      return res.status(400).json({ error: `Falta el archivo "${campoArchivo}"` });
    }

    // Inferimos nombres: relacion = campoArchivo, fk = <campoArchivo>Id
    const relacion = campoArchivo;
    const fk = `${campoArchivo}Id`;

    // Traigo el recurso con la relación para saber si hay anterior
    const actual = await modeloPrisma.findUnique({
      where: { id },
      include: { [relacion]: true },
    });
    if (!actual) return res.status(404).json({ error: `${nombreRecurso} no encontrado` });

    // Subir al storage activo (local/S3/R2)
    const put = await archivoStorage.put({
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      keyHint: `${modeloPrisma._model}/${campoArchivo}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
    });

    // Crear fila en Archivo
    const nuevo = await prisma.archivo.create({
      data: { key: put.key, url: put.url, mimeType: file.mimetype, size: file.size },
    });

    // Borrar anterior si corresponde
    if (borrarAnterior && actual[relacion]) {
      try {
        if (actual[relacion].key) await archivoStorage.remove(actual[relacion].key);
        await prisma.archivo.delete({ where: { id: actual[fk] } }).catch(() => {});
      } catch (_) { /* no romper por limpieza */ }
    }

    // Setear FK
    const actualizado = await modeloPrisma.update({
      where: { id },
      data: { [fk]: nuevo.id },
      include: { [relacion]: true },
    });

    return res.status(200).json({
      mensaje: `${campoArchivo} actualizado correctamente`,
      recurso: actualizado,
    });
  } catch (error) {
    console.error('subirArchivoGenerico error:', error);
    return res.status(500).json({ error: 'No se pudo subir/adjuntar el archivo' });
  }
}
