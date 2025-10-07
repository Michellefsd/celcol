// src/routes/ordenTrabajo.route.js (ESM)
import { Router } from 'express';
import {
  getAllOrdenes,
  getOrdenById,
  createOrden,
  updateFase2,
  subirArchivoOrden,
  updateFase3,
  subirArchivoFactura,
  guardarDatosFactura,
  crearRegistroTrabajo,
  editarRegistroTrabajo,
  eliminarRegistroTrabajo,
  cerrarOrden,
  cancelarOrden,
  archivarOrden,
} from '../controllers/ordenTrabajo.controller.js';
import { descargarOrdenPDF } from '../controllers/ordenTrabajo.descarga.controller.js';
import { descargarConformidadPDF } from '../controllers/ccm.controller.js'
import { uploadOrdenTrabajo } from '../../middleware/upload.middleware.js';

const router = Router();

// 1. Obtener todas las órdenes
router.get('/', getAllOrdenes);

// 2. Obtener una orden por ID
router.get('/:id', getOrdenById);

// 3. Crear una nueva orden
router.post('/', createOrden);

// 4. Subir archivo solicitudFirma (fase 2)
router.put('/:id/fase2', uploadOrdenTrabajo, updateFase2);

// Ruta específica para subir solo el archivo solicitudFirma
router.post('/:id/solicitudFirma', uploadOrdenTrabajo, subirArchivoOrden);

// 5. Actualizar fase 3
router.put('/:id/fase3', updateFase3);

// 6. Subir archivo y datos de factura (fase 4)
router.post('/:id/factura', uploadOrdenTrabajo, subirArchivoFactura);
router.put('/:id/factura', guardarDatosFactura);

// 7. Agregar registros de trabajo (fase 4)
router.post('/:id/registro-trabajo', crearRegistroTrabajo);

// 7.5 Editar registro de trabajo
router.put('/:id/registro-trabajo/:registroId', editarRegistroTrabajo);

// 8. Eliminar registro de trabajo
router.delete('/:id/registro-trabajo/:registroId', eliminarRegistroTrabajo);

// 9. Cerrar orden
router.put('/:id/cerrar', cerrarOrden);

// 10. Cancelar orden
router.put('/:id/cancelar', cancelarOrden);

// 11. Archivar orden
router.put('/:id/archivar', archivarOrden);

// 12. Descargar PDF de la orden
router.get('/:id/pdf', descargarOrdenPDF);

// 13. Descargar PDF de conformidad CCM
router.post('/:id/conformidad-pdf', descargarConformidadPDF);

//14. Descargar Plantillas Genericas
router.get('/plantilla-en-blanco/:tipo', descargarPlantillaEnBlanco);

export default router;
