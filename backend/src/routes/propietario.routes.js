const express = require('express');
const router = express.Router();
const controller = require('../controllers/propietario.controller');

router.get('/', controller.listarPropietarios);
router.post('/', controller.crearPropietario);
router.get('/:id', controller.obtenerPropietario);
router.put('/:id', controller.actualizarPropietario);
router.delete('/:id', controller.eliminarPropietario);


module.exports = router;
