const express = require('express');
const router = express.Router();
const controlador = require('../controllers/avion.controller');

// Crear un avión
router.post('/', controlador.crearAvion);

// Obtener todos los aviones (con propietarios)
router.get('/', controlador.listarAviones);

// Obtener un avión específico por ID
router.get('/:id', controlador.obtenerAvion);

// Actualizar los datos de un avión
router.put('/:id', controlador.actualizarAvion);

// Asignar propietarios a un avión
router.post('/:id/propietarios', controlador.asignarPropietarios);

// Eliminar un avión (y sus relaciones)
router.delete('/:id', controlador.eliminarAvion);

module.exports = router;
