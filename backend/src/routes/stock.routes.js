const express = require('express');
const router = express.Router();
const controlador = require('../controllers/stock.controller');

// Obtener todos los productos
router.get('/', controlador.listarStock);

// Obtener uno por ID
router.get('/:id', controlador.obtenerStock);

// Crear producto
router.post('/', controlador.crearStock);

// Actualizar producto
router.put('/:id', controlador.actualizarStock);

// Eliminar producto
router.delete('/:id', controlador.eliminarStock);

module.exports = router;
