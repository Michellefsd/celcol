const express = require('express');
const router = express.Router();
const controlador = require('../controllers/herramientas.controller');
const { uploadHerramientas } = require('../../middleware/upload.middleware');

// Obtener todas las herramientas
router.get('/', controlador.listarHerramientas);

// Obtener una herramienta por ID
router.get('/:id', controlador.obtenerHerramienta);

// Crear herramienta (solo certificadoCalibracion)
router.post('/', uploadHerramientas, controlador.crearHerramienta);

// Actualizar herramienta (puede reemplazar certificadoCalibracion)
router.put('/:id', uploadHerramientas, controlador.actualizarHerramienta);

// Eliminar herramienta
router.delete('/:id', controlador.eliminarHerramienta);

module.exports = router;
