const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas

const propietarioRoutes = require('./src/routes/propietario.routes');
app.use('/propietarios', propietarioRoutes);

const avionRoutes = require('./src/routes/avion.routes');
app.use('/aviones', avionRoutes);

const motoresRoutes = require('./src/routes/motores.routes');
app.use('/motores', motoresRoutes);

const helicesRoutes = require('./src/routes/helices.routes');
app.use('/helices', helicesRoutes);

const stockRoutes = require('./src/routes/stock.routes');
app.use('/stock', stockRoutes);

const herramientasRoutes = require('./src/routes/herramientas.routes');
app.use('/herramientas', herramientasRoutes);

const empleadoRoutes = require('./src/routes/empleado.routes');
app.use('/empleados', empleadoRoutes);

const componentesRoutes = require('./src/routes/componentes.routes');
app.use('/componentes', componentesRoutes);

//  FIN de RUtas

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
