// backend/src/services/archivo.service.js  (ESM)
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ===== Config común =====
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local'; // 'local' | 's3'
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const PUBLIC_BASE = process.env.LOCAL_PUBLIC_BASE_URL || ''; // ej: http://localhost:8080/uploads

// Helpers
const safe = (s='') => String(s).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-/_]/g, '');
const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const rand = (n=8) => crypto.randomBytes(n).toString('hex');
const buildKey = ({ keyHint, originalName }) => {
  const base = keyHint ? safe(keyHint) : `misc/${nowStamp()}-${rand()}`;
  const name = originalName ? `-${safe(originalName)}` : '';
  return `${base}${name}`.replace(/^\/+/, '');
};

// ===== Driver LOCAL (como tenías) =====
const localDisk = {
  async put({ buffer, originalName, keyHint }) {
    const key = buildKey({ keyHint, originalName });
    const fullPath = path.join(UPLOADS_DIR, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    const url = PUBLIC_BASE
      ? `${PUBLIC_BASE.replace(/\/+$/, '')}/${key}`
      : `/uploads/${key}`;
    return { key, url };
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

  // Opcional: si tenés un CDN/dominio público para servir objetos sin firma
  const PUBLIC_CDN_BASE = process.env.PUBLIC_CDN_BASE || ''; // ej: https://cdn.tu-dominio.com

  s3Strategy = {
    async put({ buffer, originalName, contentType, keyHint }) {
      const key = buildKey({ keyHint, originalName });
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      }));
      // Si tenés CDN público, devolvés URL pública; si no, guardás vacío y usarás URL firmada luego.
      const url = PUBLIC_CDN_BASE ? `${PUBLIC_CDN_BASE.replace(/\/+$/, '')}/${key}` : '';
      return { key, url };
    },
    async remove(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    },
  };
}

// ===== Export seleccionado =====
export const archivoStorage = (STORAGE_DRIVER === 's3' ? s3Strategy : localDisk);
