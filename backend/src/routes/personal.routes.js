// src/routes/personal.route.js
import { Router } from 'express';
import {
  crearPersonal,
  actualizarPersonal,
  listarPersonal,
  obtenerPersonal,
  obtenerRegistrosDeTrabajo,
  archivarPersonal,
  subirCarneSalud,
  descargarHorasEmpleado,
  // eliminarPersonal // (sigue deshabilitado)
} from '../controllers/personal.controller.js';
import { uploadPersonal } from '../../middleware/upload.middleware.js';

const router = Router();

// Crear personal (con carne de salud)
router.post('/', uploadPersonal, crearPersonal);

// Actualizar personal (con posible nuevo carne de salud)
router.put('/:id', uploadPersonal, actualizarPersonal);

// Listar todo el personal
router.get('/', listarPersonal);

// Obtener un personal por ID
router.get('/:id', obtenerPersonal);

// Registros de trabajo de un empleado
router.get('/:id/registros-trabajo', obtenerRegistrosDeTrabajo);

// Archivar personal (soft-delete)
router.patch('/archivar/:id', archivarPersonal);

// Subir carne de salud
router.post('/:id/carneSalud', uploadPersonal, subirCarneSalud);

// Descargar horas trabajadas en PDF
router.get('/:id/registros-trabajo/pdf', descargarHorasEmpleado);

// // Eliminar personal (deshabilitado)
// // router.delete('/:id', eliminarPersonal);

export default router;
