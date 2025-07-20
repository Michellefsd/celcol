const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajo.controller');
const { uploadOrdenTrabajo } = require('../../middleware/upload.middleware');

// 1. Obtener todas las órdenes
router.get('/', ordenTrabajoController.getAllOrdenes);

// 2. Obtener una orden por ID
router.get('/:id', ordenTrabajoController.getOrdenById);

// 3. Crear una nueva orden
router.post('/', ordenTrabajoController.createOrden);

// 4. Subir archivo solicitudFirma (fase 2)
//router.post('/:id/archivo', uploadOrdenTrabajo, ordenTrabajoController.subirArchivoOrden);
router.put('/:id/fase2', uploadOrdenTrabajo, ordenTrabajoController.updateFase2);


// 5. Actualizar fase 3
//router.put('/:id/fase3', ordenTrabajoController.updateFase3);

// 6. Actualizar fase 4
//router.put('/:id/fase4', ordenTrabajoController.updateFase4);

// 7. Eliminar una orden
router.delete('/:id', ordenTrabajoController.deleteOrden);

module.exports = router;
