const express = require('express');
const router = express.Router();
const avionController = require('../controllers/avion.controller');
const { uploadAvion } = require('../../middleware/upload.middleware');
const { revisarAvionesSinPropietario } = require('../utils/avisos');

console.log('[avion.routes] tipos =>', {
  uploadAvion: typeof uploadAvion,
  crearAvion: typeof avionController.crearAvion,
  actualizarAvion: typeof avionController.actualizarAvion,
  listarAviones: typeof avionController.listarAviones,
  obtenerAvion: typeof avionController.obtenerAvion,
  archivarAvion: typeof avionController.archivarAvion,
  asignarPropietarios: typeof avionController.asignarPropietarios,
  subirCertificadoMatricula: typeof avionController.subirCertificadoMatricula,
});


// Crear avión
router.post('/', uploadAvion, avionController.crearAvion);

// Actualizar avión
router.put('/:id', uploadAvion, avionController.actualizarAvion);

// Listar todos
router.get('/', avionController.listarAviones);

// Obtener por ID
router.get('/:id', avionController.obtenerAvion);

// Archivar avión 
router.patch('/archivar/:id', avionController.archivarAvion);

// Asignar propietarios
router.post('/:id/asignar-propietarios', avionController.asignarPropietarios);

// Subir certificado
router.post('/:id/certificadoMatricula', uploadAvion, avionController.subirCertificadoMatricula);

// Eliminar avión
//router.delete('/:id', avionController.eliminarAvion); 

module.exports = router;

