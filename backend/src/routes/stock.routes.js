
// src/routes/stock.route.js
import { Router } from 'express';
import {
  crearStock,
  actualizarStock,
  listarStock,
  obtenerStock,
  archivarStock,
  subirImagenStock,
  // Facturas (1:N)
  listarPorStock,
  crear,
  eliminar,
  actualizar,
} from '../controllers/stock.controller.js';
import { uploadStock, uploadUnico } from '../../middleware/upload.middleware.js';

const router = Router();

// Crear producto de stock
router.post('/', uploadStock, crearStock);

// Actualizar producto de stock
router.put('/:id', uploadStock, actualizarStock);

// Listar y obtener
router.get('/', listarStock);
router.get('/:id', obtenerStock);

// Archivar (soft-delete)
router.patch('/archivar/:id', archivarStock);

// Imagen (1:1)
router.post('/:id/imagen', uploadStock, subirImagenStock);

// Facturas (1:N)
router.get('/:id/facturas', listarPorStock);
router.post('/:id/facturas', uploadUnico, crear);      // ← sin .single()
router.put('/facturas/:facturaId', actualizar);
router.delete('/facturas/:facturaId', eliminar);

export default router;
