const express = require('express');
const router = express.Router();
const controlador = require('../controllers/herramientas.controller');
const upload = require('../../middleware/upload.middleware');

// Obtener todas las herramientas
router.get('/', controlador.listarHerramientas);

// Obtener una herramienta por ID
router.get('/:id', controlador.obtenerHerramienta);

// Crear herramienta con archivo opcional (archivo8130)
router.post('/', upload.single('archivo8130'), controlador.crearHerramienta);

// Actualizar herramienta (con posibilidad de nuevo archivo)
router.put('/:id', upload.single('archivo8130'), controlador.actualizarHerramienta);

// Eliminar herramienta
router.delete('/:id', controlador.eliminarHerramienta);

// Subir archivo 8130 por separado (opcional)
router.post('/upload-8130/:herramientaId', upload.single('archivo'), controlador.subirArchivo8130);

module.exports = router;
