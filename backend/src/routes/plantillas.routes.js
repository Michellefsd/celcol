import { Router } from 'express';
import { descargarPlantillaEnBlanco } from '../controllers/plantillas.controller.js';

const router = Router();
router.get('/:tipo', descargarPlantillaEnBlanco);
export default router;
