import { Router } from 'express';
import {
  listarComponentesExternos,
  obtenerComponenteExterno,
  crearComponenteExterno,
  actualizarComponenteExterno,
  archivarComponenteExterno,
  subirArchivo8130,
} from '../controllers/componenteExterno.controller.js';
import { uploadComponenteExterno } from '../../middleware/upload.middleware.js';

const router = Router();

// Listar todos los componentes externos
router.get('/', listarComponentesExternos);

// Obtener un componente externo por ID
router.get('/:id', obtenerComponenteExterno);

// Crear componente externo con archivo opcional (8130)
router.post('/', uploadComponenteExterno, crearComponenteExterno);

// Actualizar componente externo (con posibilidad de nuevo 8130)
router.put('/:id', uploadComponenteExterno, actualizarComponenteExterno);

// Archivar componente externo (soft-delete)
router.patch('/archivar/:id', archivarComponenteExterno);

// Subir archivo 8130 por separado
router.post('/:componenteId/archivo8130', uploadComponenteExterno, subirArchivo8130);

// // Eliminar (deshabilitado)
// // router.delete('/:id', eliminarComponenteExterno);

export default router;
