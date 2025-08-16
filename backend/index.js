require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// === UTILS AVISOS ===
const {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
} = require('./src/utils/avisos');

const app = express();
app.set('trust proxy', 1);

// === PARSERS ===
app.use(express.json());
app.use(cookieParser());
app.get('/health', (req, res) => res.send('ok')); 

// === CORS (permitir cookies httpOnly desde el front) ===
const ALLOWED_ORIGINS = [
  'http://localhost:3000', // FRONT dev
  // 'https://tu-dominio-front.com',
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // permite Postman/cURL
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// ❗️Express 5: usar RegExp para preflight en lugar de '*'
app.options(/.*/, cors(corsOptions));

// === ESTÁTICOS PÚBLICOS ===
app.use(express.static(path.join(__dirname, 'public')));

// === REVISIÓN MANUAL AL INICIO (60s) ===
(async () => {
  console.log('⏳ Esperando 60 segundos para ejecutar revisión inicial...');
  setTimeout(async () => {
    console.log('🚨 Ejecutando revisión manual ahora...');
    try {
      await revisarTodasLasHerramientas(prisma);
      await revisarAvionesSinPropietario(prisma);
      console.log('✅ Revisión inicial completada.');
    } catch (err) {
      console.error('❌ Error en revisión inicial:', err);
    }
  }, 60000);
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

// === RUTAS AUTH ===
app.use('/auth', require('./src/routes/auth.routes'));

// === RUTAS PRINCIPALES ===
app.use('/propietarios', require('./src/routes/propietario.routes'));
app.use('/aviones', require('./src/routes/avion.routes'));
app.use('/componentes-avion', require('./src/routes/avionComponente.routes'));
app.use('/stock', require('./src/routes/stock.routes'));
app.use('/herramientas', require('./src/routes/herramientas.routes'));
app.use('/personal', require('./src/routes/personal.routes'));
app.use('/componentes', require('./src/routes/componenteExterno.routes'));
app.use('/ordenes-trabajo', require('./src/routes/ordenTrabajo.routes'));
app.use('/avisos', require('./src/routes/avisos.routes'));
app.use('/archivados', require('./src/routes/archivados.routes'));

// === ARCHIVOS SUBIDOS ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === SERVER LISTEN ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
