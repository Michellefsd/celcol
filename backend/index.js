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
import { requireAuth } from './middleware/authz.js'
// Utils (ESM)
import {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
} from './src/utils/avisos.js';

// Rutas públicas/archivos
import archivosRoutes from './src/routes/archivos.routes.js';

// Rutas protegidas (ESM)
import propietariosRoutes from './src/routes/propietario.routes.js';
import avionRoutes from './src/routes/avion.routes.js';
import avionComponentesRoutes from './src/routes/avionComponente.routes.js';
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

// ✅ detrás de proxy (Railway)
app.set('trust proxy', 1);

// === CONFIG ARCHIVOS / URLS PÚBLICAS ===
const PUBLIC_BASE = process.env.API_PUBLIC_URL || process.env.PUBLIC_BASE || '';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

// === PARSERS ===
app.use(express.json());
app.use(cookieParser());

// === CORS (ANTES de rutas) ===
const ALLOWED_ORIGINS = [
  'https://celcol-administradores.vercel.app', // PROD
  'http://localhost:3000',                     // DEV
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/healthcheck
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD'],
  allowedHeaders: ['Content-Type','Authorization','Accept'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // preflight

// === HEALTH ===
app.get('/', (_req, res) => res.send('Celcol API: ok'));
app.get('/health', (_req, res) => res.status(200).send('ok'));
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
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    sub: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    roles: req.user.roles || [],
  });
});

// === RUTAS PROTEGIDAS (todas bajo /api) ===
app.use('/api/propietarios',      requireAuth, propietariosRoutes);
app.use('/api/aviones',           requireAuth, avionRoutes);
app.use('/api/componentes-avion', requireAuth, avionComponentesRoutes);
app.use('/api/stock',             requireAuth, stockRoutes);
app.use('/api/herramientas',      requireAuth, herramientasRoutes);
app.use('/api/personal',          requireAuth, personalRoutes);
app.use('/api/componentes',       requireAuth, componentesExtRoutes);
app.use('/api/ordenes-trabajo',   requireAuth, ordenTrabajoRoutes);
app.use('/api/avisos',            requireAuth, avisosRoutes);
app.use('/api/archivados',        requireAuth, archivadosRoutes);
app.use('/api/archivadas',        requireAuth, archivadosRoutes);

// Rutas de archivos (públicas o privadas según tus handlers)
app.use('/api/archivos', archivosRoutes);

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

app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err?.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// === LISTEN ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en puerto ${PORT}`);
});
