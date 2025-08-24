import { Router } from 'express';
import {
  listarAvisos,
  marcarComoLeido,
  eliminarAviso,
} from '../controllers/avisos.controller.js';

const router = Router();

router.get('/', listarAvisos);
router.put('/:id/leido', marcarComoLeido);
router.delete('/:id', eliminarAviso);

export default router;
