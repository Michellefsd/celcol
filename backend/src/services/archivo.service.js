// backend/src/services/archivo.service.js (ESM)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const PUBLIC_BASE = process.env.LOCAL_PUBLIC_BASE_URL || '';

// Local disk strategy
const localDisk = {
  async put({ buffer, originalName }) {
    const key = `${Date.now()}-${originalName.replace(/\s+/g, '-')}`;
    const fullPath = path.join(UPLOADS_DIR, key);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    return {
      key,
      url: PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : `/uploads/${key}`
    };
  },
  async remove(key) {
    const fullPath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(fullPath)) await fs.promises.unlink(fullPath);
  },
};

// TODO: implementar s3Strategy

export const archivoStorage = localDisk;
