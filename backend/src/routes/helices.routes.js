const express = require('express');
const router = express.Router();
const controller = require('../controllers/helices.controller');

router.get('/', controller.listarHelices);
router.post('/', controller.crearHelice);
router.get('/:id', controller.obtenerHelice);
router.put('/:id', controller.actualizarHelice);
router.delete('/:id', controller.eliminarHelice);

module.exports = router;
