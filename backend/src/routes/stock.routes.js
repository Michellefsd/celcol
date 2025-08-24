// src/routes/stock.route.js
import { Router } from 'express';
import {
  crearStock,
  actualizarStock,
  listarStock,
  obtenerStock,
  archivarStock,
  subirArchivoStock,
  subirImagenStock,
  // Facturas:
  listarPorStock,
  crear,
  eliminar,
  actualizar,
} from '../controllers/stock.controller.js';
import { uploadStock, uploadUnico } from '../../middleware/upload.middleware.js';

const router = Router();

// Crear producto de stock con imagen y factura
router.post('/', uploadStock, crearStock);

// Actualizar producto de stock (también puede incluir archivos)
router.put('/:id', uploadStock, actualizarStock);

// Obtener todos los productos de stock
router.get('/', listarStock);

// Obtener un producto por ID
router.get('/:id', obtenerStock);

// Archivar producto de stock (soft-delete)
router.patch('/archivar/:id', archivarStock);

// Subir factura PDF (archivo)
router.post('/:id/archivo', uploadStock, subirArchivoStock);

// Facturas vinculadas a un item de stock
router.get('/:id/facturas', listarPorStock);
router.post('/:id/facturas', uploadUnico, crear);
router.delete('/facturas/:facturaId', eliminar);
router.put('/facturas/:facturaId', actualizar);

// Subir imagen optimizada
router.post('/:id/imagen', uploadStock, subirImagenStock);

export default router;
