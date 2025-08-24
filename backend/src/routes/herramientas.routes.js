import { Router } from 'express';
import {
  listarHerramientas,
  obtenerHerramienta,
  crearHerramienta,
  actualizarHerramienta,
  subirCertificadoCalibracion,
  archivarHerramienta,
} from '../controllers/herramientas.controller.js';
import { uploadHerramientas } from '../../middleware/upload.middleware.js';

const router = Router();

router.get('/', listarHerramientas);
router.get('/:id', obtenerHerramienta);
router.post('/', uploadHerramientas, crearHerramienta);
router.put('/:id', uploadHerramientas, actualizarHerramienta);
router.post('/:id/certificadoCalibracion', uploadHerramientas, subirCertificadoCalibracion);
router.patch('/archivar/:id', archivarHerramienta);

// // router.delete('/:id', eliminarHerramienta); // deshabilitado

export default router;
