// src/utils/archivoupload.js (ESM)
import fs from 'node:fs/promises';
import prisma from '../prisma.js';
import { archivoStorage } from '../services/archivo.service.js';
import { createHash } from 'node:crypto';

function safeFilename(name) {
  const base = String(name || 'archivo').trim();
  let cleaned = base.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
  return cleaned || `archivo-${Date.now()}.bin`;
}

function normalizeMime(m) {
  const v = String(m || '').toLowerCase();
  if (v === 'image/jpg') return 'image/jpeg';
  return v;
}

/**
 * Crea una fila Archivo subiendo a storage. NO actualiza ninguna FK.
 * Útil para relaciones 1:N (p.ej. FacturaStock -> Archivo).
 *
 * @returns { id, storageKey, mime, originalName, sizeAlmacen }
 */
export async function crearArchivoDesdeFile({
  file,                    // req.file o { buffer, mimetype, originalname, path? }
  keyPrefix = 'archivo',   // ej: 'stock/factura/123'
  keySuffix = '',          // opcional extra
  allow = [],              // lista de MIME permitidos; admite 'image/*'
  blockSvg = true,         // por seguridad
  maxSizeMB = 0,           // 0 = sin límite
}) {
  // ---- leer buffer ----
  let buffer;
  if (file?.buffer) buffer = file.buffer;               // memoryStorage
  else if (file?.path) buffer = await fs.readFile(file.path); // diskStorage
  else throw new Error('No se pudo acceder al contenido del archivo');

  // ---- validaciones ----
  const mime = normalizeMime(file?.mimetype);
  if (blockSvg && mime === 'image/svg+xml') {
    throw new Error('SVG no permitido');
  }
  if (Array.isArray(allow) && allow.length) {
    const allowSet = new Set(allow.map(s => s.toLowerCase().trim()));
    const allowAllImages = allowSet.has('image/*');
    const ok = allowSet.has(mime) || (allowAllImages && mime.startsWith('image/'));
    if (!ok) throw new Error(`MIME no permitido: ${mime}`);
  }
  if (maxSizeMB > 0 && buffer.length > maxSizeMB * 1024 * 1024) {
    throw new Error(`El archivo supera el máximo de ${maxSizeMB}MB`);
  }

  // ---- nombre y key ----
  const originalName = file?.originalname || 'archivo.bin';
  const safeName = safeFilename(originalName);
  const cleanPrefix = String(keyPrefix || 'archivo').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  const suffix = keySuffix ? `/${String(keySuffix).replace(/^\/+/, '')}` : '';
  const keyHint = `${cleanPrefix}${suffix}`;

  // ---- hash & upload ----
  const hashSha256 = createHash('sha256').update(buffer).digest('hex');
  const put = await archivoStorage.put({
    buffer,
    contentType: mime || undefined,
    originalName,
    keyHint, // adapter devuelve { key, url?, size? }
  });

  // ---- persistir en DB; si falla, rollback en storage ----
  try {
    const nuevo = await prisma.archivo.create({
      data: {
        storageKey: put.key,
        urlPublica: put?.url ?? null, // si tu schema tiene este campo
        originalName,
        mime: mime ?? null,
        sizeOriginal: buffer.length ?? null,
        sizeAlmacen: (put && put.size) ? Number(put.size) : (buffer.length ?? null),
        hashSha256,
      },
      select: { id: true, storageKey: true, mime: true, originalName: true, sizeAlmacen: true },
    });
    return nuevo;
  } catch (e) {
    // rollback físico best-effort
    try { if (put?.key) await archivoStorage.remove(put.key); } catch {}
    throw e;
  }
}

/**
 * Relación 1:1 genérica (tu helper original), ahora usando crearArchivoDesdeFile bajo el capó.
 * Actualiza el FK <campoArchivo>Id en el modelo y (opcional) borra el anterior.
 */
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
  allow = [],          // mismos flags que arriba
  blockSvg = true,
  maxSizeMB = 0,
}) {
  try {
    const id = Number(req.params?.[campoParam]);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const formField = campoForm || campoArchivo;
    const file = req.files?.[formField]?.[0] ?? req.file;
    if (!file) return res.status(400).json({ error: `Falta el archivo "${formField}"` });

    const relacion = campoArchivo;      // ej: 'certificadoCalibracion'
    const fk = `${campoArchivo}Id`;     // ej: 'certificadoCalibracionId'

    const actual = await modeloPrisma.findUnique({
      where: { id },
      select: {
        [fk]: true,
        [relacion]: { select: { id: true, storageKey: true, urlPublica: true } },
      },
    });
    if (!actual) return res.status(404).json({ error: `${nombreRecurso} no encontrado` });

    // 1) crear Archivo
    const archivo = await crearArchivoDesdeFile({
      file,
      keyPrefix: (prefix || nombreRecurso.toLowerCase()).replace(/\s+/g, '-'),
      keySuffix: `${id}/${campoArchivo}`,
      allow,
      blockSvg,
      maxSizeMB,
    });

    // 2) actualizar FK al nuevo archivo
    const actualizado = await modeloPrisma.update({
      where: { id },
      data: { [fk]: archivo.id },
      include: { [relacion]: true },
    });

    // 3) borrar anterior (DB + storage) best-effort
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

    return res.status(200).json({
      mensaje: `${campoArchivo} actualizado correctamente`,
      recurso: actualizado,
    });
  } catch (error) {
    console.error('subirArchivoGenerico error:', error);
    return res.status(500).json({ error: 'No se pudo subir/adjuntar el archivo' });
  }
}
