const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { uploadStock } = require('../../middleware/upload.middleware');

// Crear producto de stock con imagen y factura
router.post('/', uploadStock, stockController.crearStock);

// Actualizar producto de stock (también puede incluir archivos)
router.put('/:id', uploadStock, stockController.actualizarStock);

// Obtener todos los productos de stock
router.get('/', stockController.listarStock);

// Obtener un producto por ID
router.get('/:id', stockController.obtenerStock);

// Eliminar un producto de stock
router.delete('/:id', stockController.eliminarStock);

// Subir factura PDF (archivo)
router.post('/:id/archivo', uploadStock, stockController.subirArchivoStock);

// Subir imagen optimizada
router.post('/:id/imagen', uploadStock, stockController.subirImagenStock);

module.exports = router;
