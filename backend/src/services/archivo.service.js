// backend/src/services/archivo.service.js  (ESM)
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import prisma from '../lib/prisma.js';


// ===== Config común =====
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local'; // 'local' | 's3'
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const PUBLIC_BASE = process.env.LOCAL_PUBLIC_BASE_URL || ''; // ej: http://localhost:8080/uploads

// Helpers
const safe = (s = '') =>
  String(s).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-/_]/g, '');
const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const rand = (n = 8) => crypto.randomBytes(n).toString('hex');
const buildKey = ({ keyHint, originalName }) => {
  const base = keyHint ? safe(keyHint) : `misc/${nowStamp()}-${rand()}`;
  const name = originalName ? `-${safe(originalName)}` : '';
  return `${base}${name}`.replace(/^\/+/, '');
};

// ===== Driver LOCAL =====
const localDisk = {
  async put({ buffer, originalName, keyHint }) {
    const key = buildKey({ keyHint, originalName });
    const fullPath = path.join(UPLOADS_DIR, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    const url = PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/+$/, '')}/${key}` : `/uploads/${key}`;
    // para mantener compatibilidad devolvemos también size
    return { key, url, size: buffer.length };
  },
  async remove(key) {
    const fullPath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(fullPath)) await fs.promises.unlink(fullPath);
  },
};

// ===== Driver S3 (Cloudflare R2 u otro S3-compatible) =====
let s3Strategy = null;

if (STORAGE_DRIVER === 's3') {
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

  const S3_ENDPOINT = process.env.S3_ENDPOINT || undefined; // R2: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  const S3_REGION = process.env.S3_REGION || 'auto';
  const S3_BUCKET = process.env.S3_BUCKET;
  const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
  const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
  const S3_FORCE_PATH_STYLE = String(process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() === 'true';

  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error('Faltan variables S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY para STORAGE_DRIVER=s3');
  }

  const s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    forcePathStyle: S3_FORCE_PATH_STYLE,
  });

  // Opcional: CDN público para objetos sin firma
  const PUBLIC_CDN_BASE = process.env.PUBLIC_CDN_BASE || '';

  s3Strategy = {
    async put({ buffer, originalName, contentType, keyHint }) {
      const key = buildKey({ keyHint, originalName });
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      }));
      const url = PUBLIC_CDN_BASE ? `${PUBLIC_CDN_BASE.replace(/\/+$/, '')}/${key}` : '';
      // size no viene del S3 SDK; devolvemos length del buffer
      return { key, url, size: buffer.length };
    },
    async remove(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    },
  };
}

// ===== Export del storage seleccionado =====
export const archivoStorage = (STORAGE_DRIVER === 's3' ? s3Strategy : localDisk);



// Valida MIME con patrones tipo 'image/*'
function mimePermitido(mime, allow = []) {
  if (!allow?.length) return true;
  return allow.some((pat) => {
    if (pat.endsWith('/*')) {
      const base = pat.split('/')[0];
      return mime?.startsWith(base + '/');
    }
    return mime === pat;
  });
}

/**
 * Sube el archivo usando archivoStorage (local o S3/R2) y crea el registro en la tabla Archivo.
 * Devuelve el registro Archivo.
 */
export async function crearArchivoDesdeFile({
  file,                   // req.file (multer)
  keyPrefix = 'misc',     // ej: 'stock/factura'
  keySuffix = '',         // ej: '<stockId>'
  allow = ['application/pdf', 'image/*'],
  blockSvg = true,
  maxSizeMB = 25,
}) {
  if (!file) throw new Error('Falta file');

  const { buffer, mimetype, originalname } = file;
  const safeName = originalname || 'archivo.bin';

  // Validaciones
  if (!mimePermitido(mimetype, allow)) {
    throw new Error(`MIME no permitido: ${mimetype}`);
  }
  if (blockSvg && (mimetype === 'image/svg+xml' || safeName.toLowerCase().endsWith('.svg'))) {
    throw new Error('SVG bloqueado por seguridad');
  }
  const max = maxSizeMB * 1024 * 1024;
  if (buffer.length > max) {
    throw new Error(`Archivo supera el máximo de ${maxSizeMB}MB`);
  }

  // Hash requerido por el schema
  const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // Hint para la clave en el storage (el storage arma el key final con buildKey)
  const keyHint = [keyPrefix, keySuffix].filter(Boolean).join('/'); // p.ej. "stock/factura/12"

  // Sube al driver seleccionado
  const put = await archivoStorage.put({
    buffer,
    originalName: safeName,
    contentType: mimetype || 'application/octet-stream',
    keyHint,
  });

  // Persistencia en DB (campos requeridos por tu modelo: sizeOriginal + hashSha256)
  const archivo = await prisma.archivo.create({
    data: {
      storageKey: put.key,
      urlPublica: put?.url ?? null,
      originalName: safeName,
      mime: mimetype ?? null,
      sizeOriginal: buffer.length,                 // tamaño original del upload (NOT NULL)
      sizeAlmacen: put?.size ?? buffer.length,     // tamaño almacenado (si el driver lo conoce)
      hashSha256,                                  // requerido por el schema (NOT NULL)
    },
  });

  return archivo;
}

/** (Opcional) Borrar del almacenamiento físico */
export async function eliminarArchivoFisico(storageKey) {
  if (!storageKey) return;
  try {
    await archivoStorage.remove(storageKey);
  } catch {
    // silencioso
  }
}
