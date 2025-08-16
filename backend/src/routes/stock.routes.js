const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { uploadStock } = require('../../middleware/upload.middleware');
const facturaStockController = require('../controllers/stock.controller');
const { uploadUnico } = require('../../middleware/upload.middleware');

// Crear producto de stock con imagen y factura
router.post('/', uploadStock, stockController.crearStock);

// Actualizar producto de stock (también puede incluir archivos)
router.put('/:id', uploadStock, stockController.actualizarStock);

// Obtener todos los productos de stock
router.get('/', stockController.listarStock);

// Obtener un producto por ID
router.get('/:id', stockController.obtenerStock);

// Eliminar un producto de stock
//router.delete('/:id', stockController.eliminarStock);

// Archivar producto de stock (soft-delete)
router.patch('/archivar/:id', stockController.archivarStock);

// Subir factura PDF (archivo)
router.post('/:id/archivo', uploadStock, stockController.subirArchivoStock);


// Facturas vinculadas a un item de stock
router.get('/:id/facturas', facturaStockController.listarPorStock);
router.post('/:id/facturas', uploadUnico, facturaStockController.crear);
router.delete('/facturas/:facturaId', facturaStockController.eliminar);
router.put('/facturas/:facturaId', facturaStockController.actualizar);


// Subir imagen optimizada
router.post('/:id/imagen', uploadStock, stockController.subirImagenStock);

module.exports = router;
