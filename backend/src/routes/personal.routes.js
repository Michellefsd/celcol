const express = require('express');
const router = express.Router();
const controller = require('../controllers/personal.controller');
const { uploadPersonal } = require('../../middleware/upload.middleware');

// Crear personal (con carne de salud)
router.post('/', uploadPersonal, controller.crearPersonal);

// Actualizar personal (con posible nuevo carne de salud)
router.put('/:id', uploadPersonal, controller.actualizarPersonal);

// Listar todo el personal
router.get('/', controller.listarPersonal);

// Obtener un personal por ID
router.get('/:id', controller.obtenerPersonal);

// Obtener todos los registros de trabajo (fecha, horas, OT, solicitud, rol) de un empleado específico
router.get('/:id/registros-trabajo', controller.obtenerRegistrosDeTrabajo);

// Eliminar personal
//router.delete('/:id', controller.eliminarPersonal);

// Archivar personal (soft-delete)
router.patch('/archivar/:id', controller.archivarPersonal);

router.post('/:id/carneSalud', uploadPersonal, controller.subirCarneSalud);

// Descargar horas trabajadas de un empleado en PDF
router.get('/:id/registros-trabajo/pdf', controller.descargarHorasEmpleado);

module.exports = router;
