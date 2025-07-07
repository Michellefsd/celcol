const express = require('express');
const router = express.Router();
const controlador = require('../controllers/componenteExterno.controller');
const { uploadUnico } = require('../../middleware/upload.middleware');

// Listar todos los componentes externos
router.get('/', controlador.listarComponentesExternos);

// Obtener un componente externo por ID
router.get('/:id', controlador.obtenerComponenteExterno);

// Crear componente externo con archivo opcional (manualPdf)
router.post('/', uploadUnico, controlador.crearComponenteExterno);

// Actualizar componente externo (con posibilidad de nuevo manualPdf)
router.put('/:id', uploadUnico, controlador.actualizarComponenteExterno);

// Eliminar componente externo
router.delete('/:id', controlador.eliminarComponenteExterno);

// Subir archivo 8130 por separado
router.post('/:componenteId/archivo8130', uploadUnico, controlador.subirArchivo8130);

module.exports = router;
