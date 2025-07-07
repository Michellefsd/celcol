const express = require('express');
const router = express.Router();
const controlador = require('../controllers/herramientas.controller');
const { uploadHerramientas, uploadUnico } = require('../../middleware/upload.middleware');

// Obtener todas las herramientas
router.get('/', controlador.listarHerramientas);

// Obtener una herramienta por ID
router.get('/:id', controlador.obtenerHerramienta);

// Crear herramienta con archivo8130 y certificadoCalibracion
router.post('/', uploadHerramientas, controlador.crearHerramienta);

// Actualizar herramienta (permite subir nuevamente archivo8130 y/o certificado)
router.put('/:id', uploadHerramientas, controlador.actualizarHerramienta);

// Eliminar herramienta
router.delete('/:id', controlador.eliminarHerramienta);

// Subir solo archivo8130 (opcional, separado)
router.post('/upload-8130/:herramientaId', uploadUnico, controlador.subirArchivo8130);

module.exports = router;
