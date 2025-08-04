const express = require('express');
const router = express.Router();
const controlador = require('../controllers/propietario.controller');

// Crear propietario
router.post('/', controlador.crearPropietario);

// Obtener todos los propietarios
router.get('/', controlador.listarPropietarios);

// Obtener un propietario por ID (con aviones y componentes)
router.get('/:id', controlador.obtenerPropietario);

// Actualizar propietario
router.put('/:id', controlador.actualizarPropietario);

// Eliminar propietario
//router.delete('/:id', controlador.eliminarPropietario);

// Archivar propietario
router.patch('/archivar/:id', controlador.archivarPropietario);

module.exports = router;
