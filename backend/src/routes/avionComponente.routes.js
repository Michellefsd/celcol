// src/routes/avionComponente.routes.js  (ejemplo ESM)

import express from 'express';
import {
  listarComponentes,
  obtenerComponente,
  crearComponente,
  actualizarComponente,
  eliminarComponente,
} from '../controllers/avionComponente.controller.js';

const router = express.Router();

// Listar todos los componentes
router.get('/', listarComponentes);

// Obtener un componente por ID
router.get('/:id', obtenerComponente);

// Crear un nuevo componente
router.post('/', crearComponente);

// Actualizar un componente existente
router.put('/:id', actualizarComponente);

// Eliminar un componente
router.delete('/:id', eliminarComponente);

export default router;
