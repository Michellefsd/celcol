const express = require('express');
const router = express.Router();
const controller = require('../controllers/empleado.controller');
const registroTrabajoController = require('../controllers/registroTrabajo.controller');

router.get('/', controller.listarEmpleados);
router.post('/', controller.crearEmpleado);
router.get('/:id', controller.obtenerEmpleado);
router.put('/:id', controller.actualizarEmpleado);
router.delete('/:id', controller.eliminarEmpleado);

// 🔍 NUEVO: Registros de trabajo por empleado
router.get('/:id/registros-trabajo', registroTrabajoController.obtenerRegistrosTrabajoPorEmpleado);

module.exports = router;
