const express = require('express');
const router = express.Router();
const controlador = require('../controllers/avionComponente.controller');

// Listar todos los componentes
router.get('/', controlador.listarComponentes);

// Obtener un componente por ID
router.get('/:id', controlador.obtenerComponente);

// Crear un nuevo componente
router.post('/', controlador.crearComponente);

// Actualizar un componente existente
router.put('/:id', controlador.actualizarComponente);

// Eliminar un componente
router.delete('/:id', controlador.eliminarComponente);

module.exports = router;
