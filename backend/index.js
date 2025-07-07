const express = require('express');
const cors = require('cors');
const path = require('path'); // ← ESTA LÍNEA FALTABA

const app = express();

app.use(cors());
app.use(express.json());

// Rutas

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//  FIN de RUtas

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
