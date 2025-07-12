const express = require('express');
const router = express.Router();
const avionController = require('../controllers/avion.controller');
const { uploadAvion } = require('../../middleware/upload.middleware');
// Crear avión (con archivo certificadoMatricula)
router.post('/', uploadAvion, avionController.crearAvion);

// Actualizar avión (con posible reemplazo de certificado)
router.put('/:id', uploadAvion, avionController.actualizarAvion);

// Listar todos los aviones
router.get('/', avionController.listarAviones);

// Obtener un avión por ID
router.get('/:id', avionController.obtenerAvion);

// Eliminar un avión
router.delete('/:id', avionController.eliminarAvion);

// Asignar propietarios a un avión
router.post('/:id/asignar-propietarios', avionController.asignarPropietarios);

module.exports = router;
