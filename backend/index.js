// backend/index.js (ESM)
import multer from 'multer';
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';


// Rutas y middlewares (ESM)
import authRoutes from './src/routes/auth.routes.js';
import { requireAuth } from './middleware/authz.js';

// Utils (ESM)
import {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
} from './src/utils/avisos.js';


// impoortar usl privada para archivos 
import archivosRoutes from './src/routes/archivos.routes.js'

// Rutas protegidas (ESM)
import propietariosRoutes from './src/routes/propietario.routes.js';
import avionRoutes from './src/routes/avion.routes.js';
import avionComponentesRoutes from './src/routes/avionComponente.routes.js'
import stockRoutes from './src/routes/stock.routes.js';
import herramientasRoutes from './src/routes/herramientas.routes.js';
import personalRoutes from './src/routes/personal.routes.js';
import componentesExtRoutes from './src/routes/componenteExterno.routes.js';
import ordenTrabajoRoutes from './src/routes/ordenTrabajo.routes.js';
import avisosRoutes from './src/routes/avisos.routes.js';
import archivadosRoutes from './src/routes/archivados.routes.js';


const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// === CONFIG ARCHIVOS / URLS PÚBLICAS ===
// PUBLIC_BASE se usa para construir Archivo.urlPublica (p. ej. http://localhost:3001 o https://api.tu-dominio.com)
const PUBLIC_BASE = process.env.API_PUBLIC_URL || process.env.PUBLIC_BASE || '';

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Asegura que /uploads exista
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

// === PARSERS ===
app.use(express.json());
app.use(cookieParser());

// === CORS (una sola vez) ===
const FRONT_ORIGIN = process.env.APP_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = [
  FRONT_ORIGIN,
  process.env.API_URL, // opcional
];


const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman/cURL
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // preflight

// Si vas a estar detrás de proxy (https), útil:
app.set('trust proxy', 1);

// === HEALTH ===
app.get('/', (_req, res) => {
  res.send('Celcol API: ok');
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// Salud de storage local (por ahora en disco). Útil antes de migrar a bucket.
app.get('/health/storage', (_req, res) => {
  try {
    fs.accessSync(UPLOADS_DIR, fs.constants.W_OK);
    res.json({ ok: true, uploadsDir: '/uploads', publicBase: PUBLIC_BASE || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'uploads no escribible' });
  }
});

// === ESTÁTICOS ===
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR, {
  fallthrough: false,
  setHeaders: (res) => { res.setHeader('Cache-Control', 'public, max-age=31536000'); }
}));

// === AUTH ===
app.use('/api/auth', authRoutes);

// Debug de env de auth (sin secretos)
app.get('/api/health/auth', (_req, res) => {
  const pick = (k) => process.env[k] || null;
  res.json({
    APP_URL: pick('APP_URL'),
    API_URL: pick('API_URL'),
    KC_BASE: pick('KC_BASE'),
    KC_REALM: pick('KC_REALM'),
    KC_CLIENT_ID: pick('KC_CLIENT_ID'),
  });
});

// Perfil (protegido)
app.get('/me', requireAuth, (req, res) => {
  res.json({
    sub: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    roles: req.user.roles || [],
  });
});

// === RUTAS PROTEGIDAS ===
app.use('/propietarios',      requireAuth, propietariosRoutes);
app.use('/aviones',           requireAuth, avionRoutes);
app.use('/componentes-avion', requireAuth, avionComponentesRoutes);
app.use('/stock',             requireAuth, stockRoutes);
app.use('/herramientas',      requireAuth, herramientasRoutes);
app.use('/personal',          requireAuth, personalRoutes);
app.use('/componentes',       requireAuth, componentesExtRoutes);
app.use('/ordenes-trabajo',   requireAuth, ordenTrabajoRoutes);
app.use('/avisos',            requireAuth, avisosRoutes);
app.use('/archivados',        requireAuth, archivadosRoutes);
app.use('/archivadas',        requireAuth, archivadosRoutes);

app.use('/archivos', archivosRoutes);

// === REVISIÓN INICIAL DIFERIDA ===
(async () => {
  console.log('⏳ Esperando 60 segundos para ejecutar revisión inicial...');
  setTimeout(async () => {
    console.log('🚨 Ejecutando revisión inicial ahora...');
    try {
      await revisarTodasLasHerramientas(prisma);
      await revisarAvionesSinPropietario(prisma);
      console.log('✅ Revisión inicial completada.');
    } catch (err) {
      console.error('❌ Error en revisión inicial:', err);
    }
  }, 60_000);
})();

// === CRON DIARIO 08:00 ===
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Ejecutando revisión diaria...');
  try {
    await revisarTodasLasHerramientas(prisma);
    await revisarAvionesSinPropietario(prisma);
    console.log('✅ Revisión diaria completada.');
  } catch (err) {
    console.error('❌ Error al revisar avisos diarios:', err);
  }
});

// === HANDLERS DE ERRORES ===
const MAX_MB = Number(process.env.MAX_FILE_MB || 10);
const ALLOWED = (process.env.ALLOWED_MIME || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use((err, _req, res, next) => {
  // 1) Archivo demasiado grande → 413
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `El archivo supera el máximo permitido (${MAX_MB} MB).`,
      sugerencia: 'Reducí la calidad o recortá la imagen antes de subirla.',
      maxMB: MAX_MB,
    });
  }
  if (err?.code === 'LIMIT_FILE_SIZE' || /file too large/i.test(err?.message || '')) {
    return res.status(413).json({
      error: `El archivo supera el máximo permitido (${MAX_MB} MB).`,
      sugerencia: 'Reducí la calidad o recortá la imagen antes de subirla.',
      maxMB: MAX_MB,
    });
  }

  // 2) Tipo de archivo no permitido → 415
  const msg = String(err?.message || '');
  if (/(tipo de archivo no permitido|solo se permiten|svg no permitido)/i.test(msg)) {
    return res.status(415).json({
      error: 'Tipo de archivo no permitido.',
      permitidos: ALLOWED.length
        ? ALLOWED
        : ['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'],
      sugerencia: 'Convertí la imagen a JPG/PNG/WEBP o subí un PDF.',
    });
  }

  return next(err);
});


// Cualquier otro
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err?.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// === LISTEN ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en puerto ${PORT}`);
});


