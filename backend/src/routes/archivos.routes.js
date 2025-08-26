// src/routes/archivos.routes.js
import express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = express.Router();

// ===== ENV =====
const {
  S3_ENDPOINT,
  S3_REGION,
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_FORCE_PATH_STYLE,
} = process.env;

if (!S3_ENDPOINT) console.warn('⚠️ Falta S3_ENDPOINT');
if (!S3_BUCKET) console.warn('⚠️ Falta S3_BUCKET');
if (!S3_ACCESS_KEY_ID) console.warn('⚠️ Falta S3_ACCESS_KEY_ID');
if (!S3_SECRET_ACCESS_KEY) console.warn('⚠️ Falta S3_SECRET_ACCESS_KEY');

// ===== S3 Client (Cloudflare R2 compatible) =====
const s3 = new S3Client({
  region: S3_REGION || 'auto',
  endpoint: S3_ENDPOINT, // ej: https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  // R2 prefiere path-style
  forcePathStyle: String(S3_FORCE_PATH_STYLE ?? 'true') !== 'false',
});

// GET /archivos/url-firmada?key=... [&disposition=inline|attachment] → { url }
router.get('/url-firmada', async (req, res) => {
  try {
    let key = String(req.query.key || '').trim();
    if (!key) return res.status(400).json({ error: 'Falta key' });
    if (!S3_BUCKET) return res.status(500).json({ error: 'Falta S3_BUCKET' });

    // Sanea la key (sin / inicial, sin backslashes)
    key = key.replace(/\\/g, '/').replace(/^\/+/, '');

    // inline (ver en navegador) por defecto; podés pasar ?disposition=attachment para forzar descarga
    const disposition = (String(req.query.disposition || 'inline').toLowerCase() === 'attachment')
      ? 'attachment'
      : 'inline';

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ResponseContentDisposition: disposition,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutos
    res.json({ url });
  } catch (err) {
    console.error('❌ Error firmando URL R2:', err);
    res.status(500).json({ error: 'No se pudo generar URL firmada' });
  }
});

// (Opcional) Diagnóstico rápido de env
router.get('/diag', (_req, res) => {
  res.json({
    endpoint: !!S3_ENDPOINT,
    bucket: S3_BUCKET || null,
    region: S3_REGION || 'auto',
    accessKey: !!S3_ACCESS_KEY_ID,
    forcePathStyle: String(S3_FORCE_PATH_STYLE ?? 'true') !== 'false',
  });
});

export default router;
