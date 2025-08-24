// src/routes/archivados.routes.js
import { Router } from 'express';
import { listarArchivados } from '../controllers/archivados.controller.js';

const router = Router();

router.get('/', listarArchivados);

export default router;
