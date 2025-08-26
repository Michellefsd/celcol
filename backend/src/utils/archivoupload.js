// src/utils/archivoupload.js (ESM)
import fs from 'node:fs/promises';
import prisma from '../prisma.js';
import { archivoStorage } from '../services/archivo.service.js';
import { createHash } from 'node:crypto';

export async function subirArchivoGenerico({
  req,
  res,
  modeloPrisma,
  campoArchivo,
  campoForm,
  campoParam = 'id',
  nombreRecurso = 'Recurso',
  borrarAnterior = false,
  prefix = '',
}) {
  try {
    const id = Number(req.params?.[campoParam]);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const formField = campoForm || campoArchivo;
    const file = req.files?.[formField]?.[0] ?? req.file;
    if (!file) return res.status(400).json({ error: `Falta el archivo "${formField}"` });

    // === leer buffer según storage ===
    let buffer;
    if (file.buffer) buffer = file.buffer;               // memoryStorage
    else if (file.path) buffer = await fs.readFile(file.path); // diskStorage
    else return res.status(400).json({ error: 'No se pudo acceder al contenido del archivo' });

    // === calcular hash requerido por Prisma ===
    const hashSha256 = createHash('sha256').update(buffer).digest('hex');

    const contentType = file.mimetype;
    const originalName = file.originalname || `${campoArchivo}.bin`;
    let safeName = originalName.trim().replace(/\s+/g, '-');     
    safeName = safeName.replace(/-+/g, '-');
    safeName = safeName.replace(/[^a-zA-Z0-9.\-_]/g, '');


    const relacion = campoArchivo; 
    const fk = `${campoArchivo}Id`;   

    const actual = await modeloPrisma.findUnique({
      where: { id },
      select: {
        [fk]: true,
        [relacion]: {
          select: { id: true, storageKey: true, urlPublica: true },
        },
      },
    });
    if (!actual) return res.status(404).json({ error: `${nombreRecurso} no encontrado` });

    // === subir a storage (S3/local/R2) ===
    const keyPrefix = (prefix || nombreRecurso.toLowerCase()).replace(/\s+/g, '-');
    const put = await archivoStorage.put({
      buffer,
      contentType,
      originalName,
      keyHint: `${keyPrefix}/${id}/${campoArchivo}/${Date.now()}-${safeName}`,
    });
    // put => { key, url?, size? }

    // Si tu esquema hace urlPublica requerida, asegurate de tener una URL
    const urlPublica = put?.url ?? null;

    // === crear fila Archivo (¡ahora con hashSha256!) ===
    const nuevo = await prisma.archivo.create({
      data: {
        storageKey: put.key,
        urlPublica,                            // null si es opcional en Prisma
        originalName,
        mime: contentType ?? null,
        sizeOriginal: buffer.length ?? null,
        sizeAlmacen: put?.size ?? buffer.length,
        hashSha256,                            // <-- clave del error
      },
      select: { id: true },
    });

    // === borrar anterior si corresponde ===
    if (borrarAnterior && actual[relacion]) {
      try {
        if (actual[relacion].storageKey) {
          await archivoStorage.remove(actual[relacion].storageKey).catch(() => {});
        }
        if (actual[fk]) {
          await prisma.archivo.delete({ where: { id: actual[fk] } }).catch(() => {});
        }
      } catch {}
    }

    // === setear FK en el recurso ===
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
