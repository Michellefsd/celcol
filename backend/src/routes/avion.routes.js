const express = require('express');
const router = express.Router();
const avionController = require('../controllers/avion.controller');

// Crear un avión
router.post('/', avionController.crearAvion);

// Obtener todos los aviones (con propietarios)
router.get('/', avionController.listarAviones);

// Obtener un avión específico por ID
router.get('/:id', avionController.obtenerAvion);

// Actualizar los datos de un avión
router.put('/:id', avionController.actualizarAvion);

// Asignar propietarios a un avión
router.post('/:id/propietarios', avionController.asignarPropietarios);

// Eliminar un avión (y sus relaciones)
router.delete('/:id', avionController.eliminarAvion);

module.exports = router;
