// backend/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./src/routes/auth.routes');
const { requireAuth } = require('./middleware/authz');

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

const {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
} = require('./src/utils/avisos');

const app = express();

// === PARSERS ===
app.use(express.json());
app.use(cookieParser());

// === CORS (una sola vez) ===
const FRONT_ORIGIN = process.env.APP_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = [FRONT_ORIGIN];


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
app.get('/health', (_req, res) => res.send('ok'));

// === ESTÁTICOS ===
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/propietarios',      requireAuth, require('./src/routes/propietario.routes'));
app.use('/aviones',           requireAuth, require('./src/routes/avion.routes'));
app.use('/componentes-avion', requireAuth, require('./src/routes/avionComponente.routes'));
app.use('/stock',             requireAuth, require('./src/routes/stock.routes'));
app.use('/herramientas',      requireAuth, require('./src/routes/herramientas.routes'));
app.use('/personal',          requireAuth, require('./src/routes/personal.routes'));
app.use('/componentes',       requireAuth, require('./src/routes/componenteExterno.routes'));
app.use('/ordenes-trabajo',   requireAuth, require('./src/routes/ordenTrabajo.routes'));
app.use('/avisos',            requireAuth, require('./src/routes/avisos.routes'));
app.use('/archivados',        requireAuth, require('./src/routes/archivados.routes'));

// === REVISIÓN INICIAL DIFERIDA ===
;(async () => {
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

// === HANDLER ERRORES ===
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err?.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// === LISTEN ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en puerto ${PORT}`);
});
