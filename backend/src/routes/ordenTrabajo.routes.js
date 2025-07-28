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
router.put('/:id/fase2', uploadOrdenTrabajo, ordenTrabajoController.updateFase2);

// Ruta específica para subir solo el archivo solicitudFirma
router.post('/:id/solicitudFirma', uploadOrdenTrabajo, ordenTrabajoController.subirArchivoOrden);

// 5. Actualizar fase 3
router.put('/:id/fase3', ordenTrabajoController.updateFase3);

// 6. Subir archivo y datos de factura (fase 4)
router.post('/:id/factura', uploadOrdenTrabajo, ordenTrabajoController.subirArchivoFactura);

// 7. Agregar registros de trabajo (fase 4)
router.post('/:id/registro-trabajo', ordenTrabajoController.agregarRegistroTrabajo);

// 8. Eliminar registro de trabajo
router.delete('/registro-trabajo/:registroId', ordenTrabajoController.eliminarRegistroTrabajo);

// 9. Cerrar orden
router.put('/:id/cerrar', ordenTrabajoController.cerrarOrden);


module.exports = router;
