import 'dotenv/config';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

export const env = {
  S3_ENDPOINT: process.env.S3_ENDPOINT || undefined,
  S3_REGION: process.env.S3_REGION || 'auto',
  S3_BUCKET: required('S3_BUCKET'),
  S3_ACCESS_KEY_ID: required('S3_ACCESS_KEY_ID'),
  S3_SECRET_ACCESS_KEY: required('S3_SECRET_ACCESS_KEY'),
  S3_FORCE_PATH_STYLE: String(process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() === 'true',

  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB || 25),
  ALLOWED_MIME: (process.env.ALLOWED_MIME || '')
    .split(',').map(s => s.trim()).filter(Boolean),
};
