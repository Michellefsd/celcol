const express = require('express');
const router = express.Router();
const controller = require('../controllers/empleado.controller');

router.get('/', controller.listarEmpleados);
router.post('/', controller.crearEmpleado);
router.get('/:id', controller.obtenerEmpleado);
router.put('/:id', controller.actualizarEmpleado);
router.delete('/:id', controller.eliminarEmpleado);


module.exports = router;
