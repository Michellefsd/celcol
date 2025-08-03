const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
} = require('./src/utils/avisos');

// === Llamadas en el arranque ===
(async () => {
  console.log('⏳ Esperando 60 segundos para ejecutar revisión inicial...');
  setTimeout(async () => {
    console.log('🚨 Ejecutando revisión manual ahora...');
    await revisarTodasLasHerramientas(prisma);
    await revisarAvionesSinPropietario(prisma);
  }, 60000); // 60 segundos
})();


const app = express();

app.use(cors());
app.use(express.json());

// === CRON diario ===
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

// === RUTAS ===
const propietarioRoutes = require('./src/routes/propietario.routes');
app.use('/propietarios', propietarioRoutes);

const avionRoutes = require('./src/routes/avion.routes');
app.use('/aviones', avionRoutes);

const componentesAvionRoutes = require('./src/routes/avionComponente.routes');
app.use('/componentes-avion', componentesAvionRoutes);

const stockRoutes = require('./src/routes/stock.routes');
app.use('/stock', stockRoutes);

const herramientasRoutes = require('./src/routes/herramientas.routes');
app.use('/herramientas', herramientasRoutes);

const personalRoutes = require('./src/routes/personal.routes');
app.use('/personal', personalRoutes);

const componentesRoutes = require('./src/routes/componenteExterno.routes');
app.use('/componentes', componentesRoutes);

const ordenTrabajoRoutes = require('./src/routes/ordenTrabajo.routes');
app.use('/ordenes-trabajo', ordenTrabajoRoutes);

const avisosRoutes = require('./src/routes/avisos.routes');
app.use('/avisos', avisosRoutes);

// Archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === FIN de Rutas ===

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
