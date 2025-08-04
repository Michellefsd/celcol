const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// === FUNCIONES DE AVISOS ===
const {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
} = require('./src/utils/avisos');

// === REVISIÓN MANUAL AL INICIO (con retardo de 60s) ===
(async () => {
  console.log('⏳ Esperando 60 segundos para ejecutar revisión inicial...');
  setTimeout(async () => {
    console.log('🚨 Ejecutando revisión manual ahora...');
    await revisarTodasLasHerramientas(prisma);
    await revisarAvionesSinPropietario(prisma);
  }, 60000);
})();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


// === CRON DIARIO ===
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

// === NUEVA RUTA: ARCHIVADOS ===
app.use('/archivados', require('./src/routes/archivados.routes'));

// === ARCHIVOS SUBIDOS ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === SERVER LISTEN ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
