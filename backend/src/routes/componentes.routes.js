const express = require('express');
const router = express.Router();
const controlador = require('../controllers/componentes.controller');
const upload = require('../../middleware/upload.middleware');

// Obtener todos los componentes
router.get('/', controlador.listarComponentes);

// Obtener un componente por ID
router.get('/:id', controlador.obtenerComponente);

// Crear componente con archivo opcional (manualPdf)
router.post('/', upload.single('manualPdf'), controlador.crearComponente);

// Actualizar componente (con posibilidad de nuevo archivo)
router.put('/:id', upload.single('manualPdf'), controlador.actualizarComponente);

// Eliminar componente
router.delete('/:id', controlador.eliminarComponente);

// Subir archivo 8130 por separado (opcional)
router.post('/:componenteId/archivo8130', upload.single('archivo'), controlador.subirArchivo8130);

module.exports = router;

