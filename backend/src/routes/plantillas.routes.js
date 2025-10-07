import { Router } from 'express';
import { descargarPlantillaEnBlanco } from '../controllers/ot.controller.js';

const router = Router();
router.get('/:tipo', descargarPlantillaEnBlanco);
export default router;
