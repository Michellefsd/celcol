const express = require('express');
const router = express.Router();
const controller = require('../controllers/motores.controller');

router.get('/', controller.listarMotores);
router.post('/', controller.crearMotor);
router.get('/:id', controller.obtenerMotor);
router.put('/:id', controller.actualizarMotor);
router.delete('/:id', controller.eliminarMotor);

module.exports = router;
