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

// Eliminar personal
router.delete('/:id', controller.eliminarPersonal);


router.post('/:id/carneSalud', uploadPersonal, controller.subirCarneSalud);


module.exports = router;
