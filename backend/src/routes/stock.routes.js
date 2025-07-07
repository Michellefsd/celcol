const express = require('express');
const router = express.Router();
const controlador = require('../controllers/stock.controller');
const { uploadStock } = require('../../middleware/upload.middleware');

// Crear producto de stock con imagen y factura
router.post('/', uploadStock, controlador.crearStock);

// Actualizar producto de stock (también puede incluir archivos)
router.put('/:id', uploadStock, controlador.actualizarStock);

// Obtener todos los productos de stock
router.get('/', controlador.listarStock);

// Obtener un producto por ID
router.get('/:id', controlador.obtenerStock);

// Eliminar un producto de stock
router.delete('/:id', controlador.eliminarStock);

module.exports = router;
