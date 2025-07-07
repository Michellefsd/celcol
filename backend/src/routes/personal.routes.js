const express = require('express');
const router = express.Router();
const controller = require('../controllers/personal.controller');

router.get('/', controller.listarPersonal);
router.post('/', controller.crearPersonal);
router.get('/:id', controller.obtenerPersonal);
router.put('/:id', controller.actualizarPersonal);
router.delete('/:id', controller.eliminarPersonal);

module.exports = router;
