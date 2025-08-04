const express = require('express');
const router = express.Router();
const avionController = require('../controllers/avion.controller');
const { uploadAvion } = require('../../middleware/upload.middleware');

// Crear avión
router.post('/', uploadAvion, avionController.crearAvion);

// Actualizar avión
router.put('/:id', uploadAvion, avionController.actualizarAvion);

// Listar todos
router.get('/', avionController.listarAviones);

// Obtener por ID
router.get('/:id', avionController.obtenerAvion);

// Archivar avión ✅ (corregido)
router.patch('/archivar/:id', avionController.archivarAvion);

// Asignar propietarios
router.post('/:id/asignar-propietarios', avionController.asignarPropietarios);

// Subir certificado
router.post('/:id/certificadoMatricula', uploadAvion, avionController.subirCertificadoMatricula);

module.exports = router;

// Eliminar avión
//router.delete('/:id', avionController.eliminarAvion); 