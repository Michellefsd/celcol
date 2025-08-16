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

router.put('/:id/factura', ordenTrabajoController.guardarDatosFactura);

// 7. Agregar registros de trabajo (fase 4)
router.post('/:id/registro-trabajo', ordenTrabajoController.crearRegistroTrabajo);

// 7,5 Editar registro de trabajo
router.put('/:id/registro-trabajo/:registroId', ordenTrabajoController.editarRegistroTrabajo);

// 8. Eliminar registro de trabajo
router.delete('/:id/registro-trabajo/:registroId', ordenTrabajoController.eliminarRegistroTrabajo);

// 9. Cerrar orden
router.put('/:id/cerrar', ordenTrabajoController.cerrarOrden);

// 10. Cancelar orden
router.put('/:id/cancelar', ordenTrabajoController.cancelarOrden);

// 11. Archivar orden
router.put('/:id/archivar', ordenTrabajoController.archivarOrden);


// 12. Descargar PDF de la orden
router.get('/:id/pdf', ordenTrabajoController.descargarOrdenPDF);

module.exports = router;
