const express = require('express');
const router = express.Router();
const controlador = require('../controllers/herramientas.controller');
const { uploadHerramientas } = require('../../middleware/upload.middleware');

// Obtener todas las herramientas
router.get('/', controlador.listarHerramientas);

// Obtener una herramienta por ID
router.get('/:id', controlador.obtenerHerramienta);

// Crear herramienta (puede incluir certificadoCalibracion)
router.post('/', uploadHerramientas, controlador.crearHerramienta);

// Actualizar herramienta (puede reemplazar certificadoCalibracion)
router.put('/:id', uploadHerramientas, controlador.actualizarHerramienta);

// Subir certificado de calibración (ruta dedicada)
router.post('/:id/certificadoCalibracion', uploadHerramientas, controlador.subirCertificadoCalibracion);

// Eliminar herramienta
router.delete('/:id', controlador.eliminarHerramienta);

module.exports = router;
