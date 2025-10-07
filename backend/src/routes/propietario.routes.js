import express from 'express';
const router = express.Router();
import * as controlador from '../controllers/propietario.controller.js';
import { descargarPlantillaEnBlanco } from '../controllers/ordenTrabajo.controller.js';

// Crear propietario
router.post('/', controlador.crearPropietario);

// Obtener todos los propietarios
router.get('/', controlador.listarPropietarios);



//14. Descargar Plantillas Genericas
router.get('/plantilla-en-blanco/:tipo', descargarPlantillaEnBlanco);


// Obtener un propietario por ID (con aviones y componentes)
router.get('/:id', controlador.obtenerPropietario);

// Actualizar propietario
router.put('/:id', controlador.actualizarPropietario);

// Eliminar propietario
//router.delete('/:id', controlador.eliminarPropietario);

// Archivar propietario
router.patch('/archivar/:id', controlador.archivarPropietario);

export default router;
