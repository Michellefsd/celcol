// ESM route — backend/src/routes/avion.route.js
import { Router } from 'express';
import {
  crearAvion,
  actualizarAvion,
  listarAviones,
  obtenerAvion,
  archivarAvion,
  asignarPropietarios,
  subirCertificadoMatricula,
} from '../controllers/avion.controller.js';
import { uploadAvion } from '../../middleware/upload.middleware.js';
import { revisarAvionesSinPropietario } from '../utils/avisos.js';

const router = Router();

// Crear avión
router.post('/', uploadAvion, crearAvion);

// Actualizar avión
router.put('/:id', uploadAvion, actualizarAvion);

// Listar todos
router.get('/', listarAviones);

// Obtener por ID
router.get('/:id', obtenerAvion);

// Archivar avión
router.patch('/archivar/:id', archivarAvion);

// Asignar propietarios
router.post('/:id/asignar-propietarios', asignarPropietarios);

// Subir certificado
router.post('/:id/certificadoMatricula', uploadAvion, subirCertificadoMatricula);

// Eliminar avión (desactivado)
// router.delete('/:id', eliminarAvion);

export default router;
